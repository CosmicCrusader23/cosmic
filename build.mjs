import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content');
const TEMPLATE_DIR = path.join(ROOT, 'templates');
const OUTPUT_POSTS_DIR = path.join(ROOT, 'posts');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const normalized = value.split('\n').map((line) => line.trimEnd()).join('\n').trim();
  fs.writeFileSync(filePath, normalized + '\n');
}

function resetDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value = '') {
  return escapeHTML(value).replaceAll('`', '&#96;');
}

function parseScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: source };

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!item) continue;
    data[item[1]] = parseScalar(item[2]);
  }
  return { data, body: source.slice(match[0].length) };
}

function splitTableRow(line) {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|')) row = row.slice(0, -1);
  return row.split('|').map((cell) => cell.trim());
}

function isTableSeparator(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function parseTable(source) {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2 || !isTableSeparator(lines[1])) return { headers: [], rows: [] };
  return {
    headers: splitTableRow(lines[0]),
    rows: lines.slice(2).filter((line) => line.includes('|')).map(splitTableRow),
  };
}

function extractHref(markdown) {
  const match = String(markdown).match(/\[[^\]]+\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/);
  return match ? match[1] : '';
}

function isExternal(url) {
  return /^(?:https?:|mailto:)/i.test(url);
}

function renderInline(markdown = '') {
  let value = escapeHTML(markdown);
  const codeSpans = [];
  const images = [];
  const links = [];

  value = value.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]+)&quot;)?\)/g, (_, alt, src, title = '') => {
    const image = `<img src="${escapeAttribute(src)}" alt="${alt}"${title ? ` title="${title}"` : ''}>`;
    images.push(image);
    return `@@IMAGE${images.length - 1}@@`;
  });

  value = value.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(`<code>${code}</code>`);
    return `@@CODE${codeSpans.length - 1}@@`;
  });

  value = value.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]+)&quot;)?\)/g, (_, label, href, title = '') => {
    const target = isExternal(href) ? ' target="_blank" rel="noopener"' : '';
    const titleAttr = title ? ` title="${title}"` : '';
    links.push(`<a href="${escapeAttribute(href)}"${target}${titleAttr}>${label}</a>`);
    return `@@LINK${links.length - 1}@@`;
  });

  value = value
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/  \n/g, '<br>');

  value = value.replace(/@@LINK(\d+)@@/g, (_, index) => links[index]);
  value = value.replace(/@@CODE(\d+)@@/g, (_, index) => codeSpans[index]);
  value = value.replace(/@@IMAGE(\d+)@@/g, (_, index) => images[index]);
  return value;
}

function plainHeadingText(value) {
  return value.replace(/[`*_~]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function slugify(value) {
  return plainHeadingText(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderTable(source, className = '') {
  const table = parseTable(source);
  if (!table.headers.length) return '';
  const classAttr = className ? ` class="${className}"` : '';
  const head = table.headers.map((header) => `<th scope="col">${renderInline(header)}</th>`).join('');
  const body = table.rows.map((row) => {
    const cells = table.headers.map((_, index) => `<td>${renderInline(row[index] || '')}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<table${classAttr}><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderMarkdown(source) {
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  const headings = [];
  const html = [];
  let index = 0;
  let listCounter = 0;

  const isSpecial = (lineIndex) => {
    const line = lines[lineIndex] || '';
    return !line.trim()
      || /^ {0,3}#{1,6}\s+/.test(line)
      || /^\s*```/.test(line)
      || /^\s*>/.test(line)
      || /^\s*(?:[-*+] |\d+\. )/.test(line)
      || /^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)
      || (line.trim().startsWith('|') && isTableSeparator(lines[lineIndex + 1] || ''));
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
    if (fence) {
      const language = fence[1] ? ` class="language-${escapeAttribute(fence[1])}"` : '';
      index += 1;
      const code = [];
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      html.push(`<pre><button class="code-copy" type="button" data-copy-code>copy</button><code${language}>${escapeHTML(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const id = `${slugify(text)}-${headings.length + 1}`;
      headings.push({ level, id, text: plainHeadingText(text) });
      html.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.trim().startsWith('|') && isTableSeparator(lines[index + 1] || '')) {
      const tableLines = [line, lines[index + 1]];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        tableLines.push(lines[index]);
        index += 1;
      }
      html.push(renderTable(tableLines.join('\n')));
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      html.push(`<blockquote>${renderInline(quote.join(' '))}</blockquote>`);
      continue;
    }

    if (/^\s*(?:[-*+] |\d+\. )/.test(line)) {
      const ordered = /^\s*\d+\. /.test(line);
      const tag = ordered ? 'ol' : 'ul';
      const items = [];
      listCounter += 1;
      while (index < lines.length) {
        const match = lines[index].match(/^\s*(?:[-*+] |\d+\. )(.+)$/);
        if (!match) break;
        items.push(`<li>${renderInline(match[1])}</li>`);
        index += 1;
      }
      html.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      html.push('<hr>');
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && !isSpecial(index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }

  return { html: html.join('\n'), headings };
}

function template(name, replacements) {
  let output = read(path.join(TEMPLATE_DIR, name));
  for (const [key, value] of Object.entries(replacements)) {
    output = output.replaceAll(`{{${key}}}`, value ?? '');
  }
  return output;
}

function readTable(name) {
  return parseTable(read(path.join(CONTENT_DIR, name)));
}

function renderProjectList(table) {
  return table.rows.map((row) => {
    const href = extractHref(row[0]);
    const tag = href ? 'a' : 'div';
    const attrs = href ? ` href="${escapeAttribute(href)}" target="_blank" rel="noopener"` : '';
    const title = (row[0] || '').replace(/\[([^\]]+)\]\([^)]+\)/, '$1');
    return `<li><${tag} class="project-card${href ? '' : ' is-static'}"${attrs}>
      <span class="project-title">${renderInline(title)}</span>
      <span class="project-year">${renderInline(row[1] || '')}</span>
      <span class="project-desc">${renderInline(row[2] || '')}</span>
    </${tag}></li>`;
  }).join('\n');
}

function renderAchievementList(table) {
  return table.rows.map((row) => `<li class="achievement-item">
    <span class="achievement-title">${renderInline(row[0] || '')}</span>
    <span class="achievement-year">${renderInline(row[1] || '')}</span>
  </li>`).join('\n');
}

function renderContactLinks(table) {
  return table.rows.map((row) => {
    const label = row[0] || '';
    let href = row[1] || '';
    if (!/^\w+:/.test(href) && /^[^/\s]+@[^/\s]+$/.test(href)) href = `mailto:${href}`;
    return `<li><a href="${escapeAttribute(href)}"${isExternal(href) ? ' target="_blank" rel="noopener"' : ''}>${renderInline(label)}</a></li>`;
  }).join('\n');
}

function readPosts() {
  const postsDirectory = path.join(CONTENT_DIR, 'posts');
  return fs.readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = read(path.join(postsDirectory, file));
      const parsed = parseFrontmatter(source);
      const slug = file.replace(/\.md$/, '');
      const rendered = renderMarkdown(parsed.body);
      return { ...parsed.data, slug, body: parsed.body, rendered };
    })
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || a.title.localeCompare(b.title));
}

function renderPostCards(posts) {
  return posts.map((post) => {
    const tags = String(post.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
    const tagMarkup = tags.length ? `<div class="post-tags">${tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join('')}</div>` : '';
    return `<article class="post-item">
      <div class="post-card-top">
        <span class="post-date">${escapeHTML(post.status === 'draft' ? 'Draft' : (post.date || 'Draft'))}</span>
        ${post.status && post.status !== 'draft' ? `<span class="post-status">${escapeHTML(post.status)}</span>` : ''}
      </div>
      <a href="posts/${escapeAttribute(post.slug)}.html" class="post-link">
        <span class="post-title">${escapeHTML(post.title || post.slug)}</span>
        <span class="post-arrow" aria-hidden="true">↗</span>
      </a>
      ${post.description ? `<p class="post-desc">${renderInline(post.description)}</p>` : ''}
      ${tagMarkup}
    </article>`;
  }).join('\n');
}

function renderHome(site) {
  const projects = renderProjectList(readTable('projects.md'));
  const achievements = renderAchievementList(readTable('achievements.md'));
  const cves = renderMarkdown(read(path.join(CONTENT_DIR, 'cves.md'))).html;
  const links = renderContactLinks(readTable('links.md'));
  const body = `<header class="intro">
    <div class="doodle" aria-hidden="true">✿</div>
    <h1>${escapeHTML(site.name)}</h1>
    <p class="identity">${renderInline(site.identity)}</p>
    <p class="bio">${renderInline(site.bio)}</p>
    <div class="now-card"><span class="now-label">now —</span> ${renderInline(site.now)}</div>
  </header>

  <section class="projects" aria-labelledby="projects-heading">
    <h2 id="projects-heading">Projects</h2>
    <ul class="project-list">${projects}</ul>
  </section>

  <section class="achievements" aria-labelledby="achievements-heading">
    <h2 id="achievements-heading">Achievements</h2>
    <ul class="achievement-list">${achievements}</ul>
  </section>

  <section class="cves" aria-labelledby="cves-heading">
    <div class="section-heading-row">
      <h2 id="cves-heading">CVEs</h2>
      <span class="section-note">security research</span>
    </div>
    <div class="cve-table-wrap">${cves}</div>
  </section>

  <section class="contact" aria-labelledby="contact-heading">
    <h2 id="contact-heading">Find me</h2>
    <ul class="link-list">${links}</ul>
  </section>`;

  return template('index.template.html', {
    TITLE: escapeHTML(site.name),
    DESCRIPTION: escapeAttribute(site.bio),
    OG_DESCRIPTION: escapeAttribute(site.identity),
    BODY: body,
    FOOTER: escapeHTML(site.footer),
  });
}

function renderPostsPage(site, posts) {
  return template('posts.template.html', {
    TITLE: 'Posts — ' + escapeHTML(site.name),
    DESCRIPTION: 'Writeups and notes by ' + escapeHTML(site.name),
    BODY: `<header class="intro">
      <div class="doodle" aria-hidden="true">✎</div>
      <h1>Posts</h1>
      <p class="identity">Technical writeups, research notes, and things worth keeping.</p>
    </header>
    <section aria-labelledby="posts-heading">
      <h2 id="posts-heading" class="sr-only">All posts</h2>
      <div class="posts-layout">
        <aside class="posts-aside" aria-label="Posts guide">
          <span class="aside-label">notes</span>
          <p>Markdown-first, linkable, and built for reading.</p>
          <a href="./" class="aside-link">← home</a>
        </aside>
        <div class="post-list">${renderPostCards(posts)}</div>
      </div>
    </section>`,
    FOOTER: escapeHTML(site.footer),
  });
}

function renderPostPage(site, post) {
  const toc = post.rendered.headings.filter((heading) => heading.level >= 2 && heading.level <= 3);
  const tocMarkup = toc.length
    ? `<nav class="post-toc" aria-label="On this page"><span class="toc-label">on this page</span><ol>${toc.map((heading) => `<li class="toc-level-${heading.level}"><a href="#${escapeAttribute(heading.id)}">${escapeHTML(heading.text)}</a></li>`).join('')}</ol></nav>`
    : '';

  return template('post.template.html', {
    ASSET_PREFIX: '../',
    TITLE: `${escapeHTML(post.title || post.slug)} — ${escapeHTML(site.name)}`,
    DESCRIPTION: escapeAttribute(post.description || 'A technical write-up by ' + site.name),
    POST_TITLE: escapeHTML(post.title || post.slug),
    POST_META: escapeHTML(post.date || post.status || 'Draft'),
    TOC: tocMarkup,
    BODY: post.rendered.html,
    FOOTER: escapeHTML(site.footer),
  });
}

const site = parseFrontmatter(read(path.join(CONTENT_DIR, 'site.md'))).data;
const posts = readPosts();

resetDirectory(OUTPUT_POSTS_DIR);
write(path.join(ROOT, 'index.html'), renderHome(site));
write(path.join(ROOT, 'posts.html'), renderPostsPage(site, posts));

for (const post of posts) {
  write(path.join(OUTPUT_POSTS_DIR, `${post.slug}.html`), renderPostPage(site, post));
}

console.log(`Built ${posts.length} post${posts.length === 1 ? '' : 's'}, CVE index, and home page.`);
