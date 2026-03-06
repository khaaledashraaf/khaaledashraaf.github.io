# khaaledashraaf.github.io

Personal portfolio website built with Next.js, Tailwind CSS, and shadcn/ui.

## Stack

- **Next.js 16** — Static export for GitHub Pages
- **Tailwind CSS v4** — Styling
- **shadcn/ui** — Component library
- **Markdown/MDX** — Blog posts

## Development

```bash
npm run dev
```

## Blog

Add new posts as `.mdx` files in `src/content/blog/`:

```mdx
---
title: "Post Title"
date: "2026-03-06"
description: "A short description."
---

Your content here.
```

## Build

```bash
npm run build
```

Static output goes to `./out`. Deployed automatically via GitHub Actions on push to `main`.
