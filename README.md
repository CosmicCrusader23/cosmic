# Personal Site

A small, static personal website. Architects Daughter font, warm neutrals, soft card-based layout.

## Edit content

Open `content.json` and change your name, bio, projects, links — the page updates automatically.

## Run locally

```bash
cd site
python3 -m http.server 8000
# open http://localhost:8000
```

Or use [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code.

> `hydrate.js` fetches `content.json`, which needs a server (not `file://`). Without a server the page still works — it just uses the HTML defaults.

## Deploy

Static site — drop the folder into GitHub Pages, Netlify, or Vercel.

## Files

```
site/
  index.html      — the page
  style.css       — all styles
  hydrate.js      — loads content.json into the page
  content.json    — your content (edit this)
```
