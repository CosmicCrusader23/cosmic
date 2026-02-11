/*
  hydrate.js
  Loads content.json and patches the page so you can edit
  text without touching HTML. Fails silently — the page
  works fine without it.
*/

(function () {
  'use strict';

  fetch('content.json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(apply)
    .catch(function () { /* content.json missing or broken — that's fine */ });

  function apply(c) {
    setText('site-name', c.name);
    setHTML('site-identity', c.identity);
    setHTML('site-bio', c.bio);

    if (c.now) {
      var nowEl = document.getElementById('site-now');
    if (nowEl) nowEl.innerHTML = '<span class="now-label">now —</span> ' + c.now;

    }

    // Page title + meta
    document.title = c.name;
    setMeta('description', c.bio);
    setMeta('og:title', c.name, true);
    setMeta('og:description', c.identity, true);

    // Projects
    if (c.projects && c.projects.length) {
      var ul = document.getElementById('project-list');
      if (ul) {
        ul.innerHTML = c.projects.map(function (p) {
          var linkAttrs = p.url && p.url !== '#'
            ? 'href="' + esc(p.url) + '" target="_blank" rel="noopener"'
            : 'href="#"';
          return '<li>'
            + '<a class="project-card" ' + linkAttrs + '>'
            + '<span class="project-title">' + esc(p.title) + '</span>'
            + '<span class="project-year">' + esc(p.year) + '</span>'
            + '<span class="project-desc">' + esc(p.description) + '</span>'
            + '</a>'
            + '</li>';
        }).join('');
      }
    }

    // Achievements
    if (c.achievements && c.achievements.length) {
      var achEl = document.getElementById('achievement-list');
      if (achEl) {
        achEl.innerHTML = c.achievements.map(function (a) {
          return '<li class="achievement-item">'
            + '<span class="achievement-title">' + esc(a.title) + '</span>'
            + '<span class="achievement-year">' + esc(a.year) + '</span>'
            + '</li>';
        }).join('');
      }
    }

    // Writing
    if (c.writing && c.writing.length) {
      var wEl = document.getElementById('writing-list');
      if (wEl) {
        var hasReal = c.writing.some(function (w) { return w.url; });
        if (hasReal) {
          var wHTML = '<ul class="writing-real-list">' + c.writing.map(function (w) {
            if (w.url) {
              return '<li><a href="' + esc(w.url) + '">' + esc(w.title) + '</a>'
                + (w.description ? ' — <span class="fg-muted">' + esc(w.description) + '</span>' : '')
                + '</li>';
            }
            return '<li>' + esc(w.title) + (w.description ? ' — ' + esc(w.description) : '') + '</li>';
          }).join('') + '</ul>';
          wEl.outerHTML = wHTML;
        } else {
          wEl.textContent = c.writing[0].description || 'More soon.';
        }
      }
    }

    // Links
    if (c.links) {
      var ll = document.getElementById('link-list');
      if (ll) {
        // render any key the user adds to `links` in content.json
        var entries = Object.entries(c.links).filter(function (kv) { return kv[1] != null && kv[1] !== ''; });
        var items = [];

        entries.forEach(function (kv) {
          var key = kv[0];
          var val = kv[1];

          // support arrays of links per key
          if (Array.isArray(val)) {
            val.forEach(function (v) { items.push(renderLink(key, v)); });
          } else {
            items.push(renderLink(key, val));
          }
        });

        ll.innerHTML = items.join('');
      }
    }

    // helper: render a single link entry (sanitized)
    function renderLink(key, value) {
      if (!value) return '';
      var k = String(key).toLowerCase();
      var labelMap = {
        email: 'email',
        github: 'github',
        twitter: 'twitter',
        bluesky: 'bluesky',
        linkedin: 'linkedin',
        youtube: 'youtube',
        mastodon: 'mastodon',
        rss: 'rss'
      };
      var label = labelMap[k] || k.replace(/[_-]/g, ' ');

      var href = String(value).trim();
      // if it's an email address, ensure mailto:
      if (k === 'email' && !/^mailto:/i.test(href)) href = 'mailto:' + href;
      // if it's missing a scheme, treat as external
      var needsTarget = !/^mailto:/i.test(href) && !/^[a-z]+:/i.test(href);
      var targetAttr = needsTarget || /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : '';

      return '<li><a href="' + esc(href) + '"' + targetAttr + '>' + esc(label) + '</a></li>';
    }

    // Footer
    if (c.footer_line) setText('footer-line', c.footer_line);
  }

  /* helpers */
  function setText(id, t) { var e = document.getElementById(id); if (e && t) e.textContent = t; }
  function setHTML(id, t) { var e = document.getElementById(id); if (e && t) e.innerHTML = esc(t); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function setMeta(name, content, isOG) {
    if (!content) return;
    var sel = isOG
      ? 'meta[property="' + name + '"]'
      : 'meta[name="' + name + '"]';
    var el = document.querySelector(sel);
    if (el) el.setAttribute('content', content);
  }
})();
