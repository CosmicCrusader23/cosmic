# Personal Site

A small, static personal website. Architects Daughter font, warm neutrals, soft card-based layout.

## Edit content

Open `content.json` and change your name, bio, projects, links — the page updates automatically.

### Structure

- **name**: Your name
- **identity**: Short tagline (e.g., "developer and ctfer")
- **bio**: A paragraph about yourself
- **now**: What you're currently up to (supports HTML links)
- **projects**: Array of `{title, description, year, url}`
- **achievements**: Array of `{title, year}`
- **writing**: Array of `{title, description, date, url}`
  - On home page: renders links directly to individual post URLs
  - On posts page: renders summaries with title, date, and description
  - Set `url: null` for placeholder entries (won't show on posts page)
- **links**: Object with keys like `email`, `github`, `twitter` etc.
  - Any key you add will automatically create a button in the "Find me" section
  - Set value to `null` to hide a link

### Adding a Post

1. Add an entry to the `writing` array in `content.json`:
   ```json
   {
     "title": "My First CTF Writeup",
     "description": "How we solved the crypto challenge at HKCERT",
     "date": "Feb 2026",
     "url": "/posts/my-first-writeup.html"
   }
   ```

2. Create the post file in the `posts/` folder (use `posts/example-post.html` as a template)

3. The home page writing section will link directly to it, and the posts page will show a summary card

**Example**: See `posts/example-post.html` for a complete post template with code blocks, formatting, and back link.

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
