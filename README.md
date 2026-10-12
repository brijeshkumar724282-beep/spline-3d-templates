# Spline 3D Templates

Four static templates that help people ship 3D sites fast with Spline plus GSAP plus Lenis. Pick a template, copy its folder, swap one scene URL, edit the copy, deploy.

## Templates

| # | Template | Use case | Folder |
|---|----------|----------|--------|
| 01 | Nebula Hero | Bold 3D hero for a product launch | [template-01-nebula-hero](./template-01-nebula-hero/) |
| 02 | Scroll Chapters | Explain a product in three scroll steps | [template-02-scroll-chapters](./template-02-scroll-chapters/) |
| 03 | Studio Cards | Portfolio layout that helps a studio win trust | [template-03-studio-cards](./template-03-studio-cards/) |
| 04 | Shop Stage | Showcase and sell one product on a 3D stage | [template-04-shop-stage](./template-04-shop-stage/) |

Open `index.html` at the repo root to browse all four with previews and copy notes.

## How to run

```bash
cd spline-3d-templates && python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Use a local server (not `file://`) so the Spline viewer module and CDN scripts load correctly.

## How to use a template

```bash
cp -r template-04-shop-stage my-shop
```

1. Copy one template folder and rename it for your project.
2. Edit the text, colors, prices, and images directly in that folder.
3. Preview your copy with `python3 -m http.server 8000` and open your folder path.
4. Deploy the folder to any static host.

Each template is self contained: `index.html` plus `styles.css` plus `script.js` with relative paths.

## How to swap the Spline scene URL

Each template renders 3D with one tag:

```html
<spline-viewer url="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"></spline-viewer>
```

To use your own scene, replace the `url` value with your public scene URL. Keep the fallback canvas in place so visitors still see an illustrated preview if 3D is slow or blocked.

## Tech

1. Spline viewer via CDN (`https://unpkg.com/@splinetool/viewer@1/build/spline-viewer.js`)
2. Lenis smooth scroll via CDN, guarded so pages work if it fails
3. GSAP plus ScrollTrigger via CDN, guarded with reduced motion support
4. Hub navigator at the root is dependency free so it always loads

## Structure

```text
spline-3d-templates/
  index.html                  Hub navigator (warm paper theme)
  styles.css                  Hub styles
  script.js                   Hub interactions (no dependencies)
  README.md                   This file
  template-01-nebula-hero/    Template 01
  template-02-scroll-chapters/ Template 02
  template-03-studio-cards/   Template 03
  template-04-shop-stage/     Template 04 (white plus dark plus indigo)
```

## Deploy note

This repo is static, so GitHub Pages hosting works directly. Push the repo, enable Pages from the repo root, and the hub becomes your landing page with each template served from its folder path.
