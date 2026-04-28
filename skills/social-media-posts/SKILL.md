---
name: social-media-posts
description: Generate ready-to-post social media images by designing them as HTML/CSS, then rendering to PNG via the sandbox. Use this skill whenever the user asks for a social media post image — Instagram square, Instagram story, LinkedIn post, Twitter/X graphic, Facebook post, TikTok cover, YouTube thumbnail, or any visual destined for a feed. The focus is on producing a finished image. Caption text is secondary unless the user explicitly asks for it.
---

## When to use this skill

The user wants a finished, post-ready **image** for a social platform. They might give you a full brief, just a sentence, or a couple of assets (logo, photo) to work with. Your output is a PNG file delivered via a download link from the sandbox.

If the user only asks for caption/copy text and doesn't mention a visual, this isn't the right skill — fall back to general writing patterns.

For maximum aesthetic quality, also call `load_skill("frontend-design")` before designing. This skill assumes you'll lean on those visual-design principles for typography, composition, and avoiding generic AI aesthetics.

## The flow

1. **Clarify** what's being designed (1–2 questions max if anything's unclear)
2. **Gather assets** — brand styling + logo + images + copy
3. **Design** as HTML + CSS sized for the target platform
4. **Render to PNG** via the sandbox
5. **Deliver** the image with download link and inline markdown the image into the users interface

## Step 1: Clarify (only if needed)

If the user gave you a clear brief, skip ahead. Otherwise ask the smallest set of questions:

- **Platform + format** (Instagram square / story, LinkedIn, X, etc.) — sets the canvas dimensions. If the user works with one platform regularly, **offer to remember it via `memory_create`** so they don't have to repeat it but ask to do so.
- **Brand / company** — so you can pull their styles and logo.
- **Subject of the post** — what's the moment or message?
- **Required assets they'll provide** — logo file, photo, copy, inspiration links?

Don't ask about things you can figure out yourself. If you know who they work for and branding source it yourself.

## Step 2: Gather assets

Pull what you need from the user, the web, or generate it. Don't ship a generic template — every post should feel made for *this* brand and *this* message.

### Brand styling (colours, fonts, logo)

If the user named a company, use the sandbox to scrape their site. Quick wins:

```bash
# Find brand colour candidates from a stylesheet
curl -s https://example.com/style.css | grep -oE "#[0-9a-fA-F]{3,6}|rgb\([^)]+\)" | sort -u | head -20
```

```python
# Or get the og:image and logo via Python
import requests
from bs4 import BeautifulSoup

html = requests.get('https://example.com', timeout=10).text
soup = BeautifulSoup(html, 'html.parser')

og = soup.find('meta', property='og:image')
print('og:image:', og['content'] if og else None)

for img in soup.find_all('img'):
    alt = (img.get('alt') or '').lower()
    if 'logo' in alt:
        print('logo candidate:', img.get('src'))
```

Look for:
- Primary brand colour + accent colour (look at hex repetitions in the CSS, the navbar background, the call-to-action button)
- Logo URL — download to `/workspace/logo.png`. **See "Logos and SVGs" below — SVGs need special handling.**
- Custom fonts — check for Google Fonts `<link href="https://fonts.googleapis.com/...">` tags

If the company doesn't expose clean assets (or there's no website), ask the user for their brand colour and logo file directly.

### Logos and SVGs

**Never embed an SVG via `<img src="logo.svg">`.** wkhtmltoimage often fails to render external SVG references, and even Chromium can choke on SVGs that depend on stylesheet variables or `<use>` references defined elsewhere. Convert or inline instead, in this priority order:

1. **Convert SVG → PNG before rendering** (works reliably for both renderers):
   ```bash
   # imagemagick is preinstalled in the sandbox
   convert -background none -density 300 /workspace/logo.svg -resize 400x /workspace/logo.png
   # Or with rsvg-convert if more accurate vector handling is needed:
   # apt-get install -y librsvg2-bin  (requires root, usually unavailable)
   ```
   Then reference `logo.png` in your HTML. `-density 300` gives crisp results at scale; `-resize 400x` caps width so the file isn't oversized.

2. **Inline the SVG XML directly in the HTML** (preserves vector sharpness if the SVG is self-contained):
   ```html
   <!-- Don't do this: -->
   <!-- <img class="logo" src="logo.svg"> -->

   <!-- Do this — paste the entire <svg>...</svg> block: -->
   <svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="..." width="200">
     <path d="..."/>
     ...
   </svg>
   ```
   Read the SVG file with sandbox, paste its content where the `<img>` would have been. Set width/height via CSS on the `<svg>` element. Only do this if the SVG is self-contained — no external CSS, no `<use xlink:href="external#id">`, no `<script>`.

3. **If the logo is buried in a page's inline `<svg>` (no downloadable .svg file)** — fetch the HTML, parse it, extract the SVG block:
   ```python
   import requests
   from bs4 import BeautifulSoup
   html = requests.get('https://example.com').text
   soup = BeautifulSoup(html, 'html.parser')
   # Find SVG by surrounding link/class hint, or by viewBox dimensions
   svg = soup.find('svg', class_=lambda c: c and 'logo' in c.lower()) \
       or soup.select_one('a[href="/"] svg') \
       or soup.find('svg')
   if svg:
       open('/workspace/logo.svg', 'w').write(str(svg))
       print('Extracted SVG:', len(str(svg)), 'chars')
   ```
   Then convert to PNG (option 1) or inline (option 2).

4. **If conversion fails or the result looks wrong, ask the user to upload their logo as a PNG.** Don't ship a broken/garbled logo. A polite ask saves more time than guessing:
   > "I had trouble extracting your logo cleanly from the website. Could you upload a PNG version (transparent background ideally)? I'll use that instead."

Quick check the converted/inline logo renders properly: render a tiny test HTML with just the logo on white background BEFORE building the full slide. If it looks wrong there, fix it before investing iterations in the full design.

### Hero / visual content

Four ways to source the main visual, in priority order:

1. **User uploaded image** — if they shared one earlier in this conversation, use it. Reference it by the URL from the `[Images available in this conversation]` footer. Use `view_image` first if you need to confirm what's in it.
2. **Edit a user image** — call `image_edit` with their image and a prompt for the change.
3. **Generate fresh** — call `image_generation` with a specific, evocative prompt.
4. **Search the web** — call `web_search` with `include_images: true` for a relevant photo. Always check licensing before final delivery and credit if the user is publishing.

Whichever you choose, **download it to `/workspace/hero.{png,jpg}`** so the renderer can embed it locally without network access.

### Copy

If the user supplied copy, use it verbatim. If not, write *minimal* copy — one headline line, optionally one short subhead. Long captions belong in the post body, not the image. Less is almost always more on a social card.

## Step 3: Design — HTML + CSS

Build the post as a single self-contained HTML file at `/workspace/post.html`. Match the canvas dimensions exactly:

| Platform / format | Canvas (W × H) |
|---|---|
| Instagram square | 1080 × 1080 |
| Instagram portrait | 1080 × 1350 |
| Instagram story / Reels cover / TikTok | 1080 × 1920 |
| LinkedIn square | 1080 × 1080 |
| LinkedIn link-share | 1200 × 627 |
| Twitter / X 16:9 | 1200 × 675 |
| Twitter / X square | 1200 × 1200 |
| Facebook | 1200 × 630 |
| YouTube thumbnail | 1280 × 720 |

### Skeleton

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Post</title>
<link href="https://fonts.googleapis.com/css2?family=YOUR_DISPLAY_FONT&family=YOUR_BODY_FONT&display=swap" rel="stylesheet">
<style>
  :root {
    --brand: #HEX;
    --accent: #HEX;
    --ink: #111;
    --paper: #fff;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1080px; }  /* match target canvas exactly */
  body {
    font-family: 'YOUR_BODY_FONT', sans-serif;
    background: var(--paper);
    color: var(--ink);
    overflow: hidden;
  }
  .post { position: relative; width: 100%; height: 100%; padding: 80px; }
  .hero { position: absolute; inset: 0; z-index: 0; object-fit: cover; width: 100%; height: 100%; }
  .content { position: relative; z-index: 1; }
  .headline {
    font-family: 'YOUR_DISPLAY_FONT', serif;
    font-size: 84px;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }
  .logo { position: absolute; bottom: 60px; left: 80px; height: 56px; }
</style>
</head>
<body>
  <div class="post">
    <img class="hero" src="file:///workspace/hero.jpg" alt="">
    <div class="content">
      <h1 class="headline">Your message here</h1>
    </div>
    <img class="logo" src="file:///workspace/logo.png" alt="">
  </div>
</body>
</html>
```

### Design principles (do not skip)

- **Match the canvas exactly** — `html, body { width: NNNpx; height: NNNpx }`. Don't guess or eyeball.
- **Embed images locally** with `file:///workspace/...`. Always download remote images to `/workspace` first so the renderer doesn't depend on network.
- **Pick fonts deliberately.** Skip Inter / Roboto / Arial / generic system fonts. Pair a distinctive display font with a clean body font, both via Google Fonts.
- **Whitespace is a feature.** Don't fill every pixel.
- **One focal point** — headline OR product OR person OR quote. Not all four.
- **Brand-colour discipline** — roughly 70/20/10: 70% paper or dark, 20% brand, 10% accent.
- **Logo placement consistent** — bottom-left or bottom-right, 5–8% of canvas height. Never huge.
- **Avoid the AI-generic look** — purple-to-blue gradients on white, centred-everything stacks, Inter at 64px on flat backgrounds. If you find yourself reaching for those, rewrite.

For deeper visual-design guidance, call `load_skill("frontend-design")`.

## Step 4: Render to PNG

Playwright + Chromium are **pre-installed** in the sandbox image — no `pip install` step needed. Just import and run:

```python
# /workspace/render.py
from playwright.sync_api import sync_playwright

WIDTH, HEIGHT = 1080, 1080  # MUST match the HTML canvas

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': WIDTH, 'height': HEIGHT}, device_scale_factor=2)
    page.goto('file:///workspace/post.html', wait_until='networkidle')
    page.wait_for_timeout(500)  # let web fonts settle
    page.screenshot(path='/workspace/post.png', full_page=False, omit_background=False)
    browser.close()

print('OK: /workspace/post.png')
```

Run it:
```bash
python /workspace/render.py
```

`device_scale_factor=2` produces a retina-quality PNG (1080×1080 canvas → 2160×2160 PNG) which crops cleanly and looks crisp on every platform. Drop to `1` if file size matters more than fidelity.

### Faster fallback for plain designs

For simple designs without custom fonts/effects, `wkhtmltoimage` is also preinstalled and ~10× faster:

```bash
wkhtmltoimage --width 1080 --height 1080 /workspace/post.html /workspace/post.png
```

Limitations: weaker font rendering, no CSS Grid in some versions, no flexbox `gap`. Use only for plain layouts.

## Step 5: Deliver

Once `/workspace/post.png` exists, give the user:

1. The download link in markdown image format so it previews:
   ```
   ![Post preview](TOOLSET_DOWNLOAD_URL/post.png)

   **[Download PNG](TOOLSET_DOWNLOAD_URL/post.png)**
   ```
   The exact URL pattern for *this* conversation comes from the `[Sandbox file downloads]` hint in the system prompt.

2. A 1-line description of what you made and the dimensions.

3. (Optional) a short caption if the user asked for it — platform-appropriate length.

If they want changes ("make the headline bigger", "swap to dark mode", "use the second photo"), edit the HTML and re-render. Don't rebuild from scratch unless the design direction is changing.

## Output

Default behaviour: ship the rendered PNG with no extra commentary unless asked. The image is the deliverable.

If you had to make assumptions (chose a colour the user didn't specify, picked a font without confirmation), list them at the bottom in one short paragraph so they can correct you.
