# Personal Site

A small, static personal website. The existing Architects Daughter font, theme, and warm neutral palette are kept in place.

## Editing content

Content now lives in Markdown instead of `content.json`:

- `content/site.md` — name, intro, now line, and footer
- `content/projects.md` — project table
- `content/achievements.md` — achievements table
- `content/cves.md` — CVE table and links
- `content/links.md` — contact links
- `content/posts/*.md` — writeups with simple frontmatter

Run `npm run build` after editing. The build script generates the static `index.html`, `posts.html`, and `posts/*.html` files that GitHub Pages serves. Writeups support headings, links, lists, blockquotes, tables, inline code, fenced code blocks, and images.

For GitHub Pages without Actions, set Pages to **Deploy from a branch**, choose `main` (or `master`) and the `/ (root)` folder. Commit the generated HTML after each build; no workflow or paid CI feature is required.
