# Hawky Blog Demo

A small static blog built with [Astro](https://astro.build) and deployed to GitHub Pages. It exists as a target for a Twenty CRM workflow: the workflow triggers this repo's GitHub Actions and commits new posts through the GitHub API.

The eight posts in `src/content/blog/` are adapted from [hawky.ai/blog](https://hawky.ai/blog). They were converted from MDX to plain Markdown, with internal links rewritten to absolute `https://hawky.ai/...` URLs.

## Run locally

Requires Node 22.12 or later.

```bash
npm install
npm run dev       # http://localhost:4321/hawky-blog-demo/
npm run build     # static output in dist/
npm run preview   # serve the built site
```

## Adding a post

Add a Markdown file to `src/content/blog/`. The file name becomes the URL slug (`my-post.md` is served at `/blog/my-post/`). Frontmatter:

```yaml
---
title: "Post title"              # required
description: "One sentence."     # required
pubDate: 2026-10-01              # required
author: "Name"                   # optional
tags: ["Performance Marketing"]  # optional
heroImage: "https://..."         # optional, absolute URL
---
```

The schema lives in `src/content.config.ts`. A file that does not match it fails the build, so a bad commit from the CRM shows up as a failed deploy rather than a broken page.

## Base path

The site is served from `https://<user>.github.io/<repo>/`, so every internal link has to include the repo name. `astro.config.mjs` reads two environment variables:

| Variable | Default | Set in CI to |
|---|---|---|
| `SITE` | `https://example.github.io` | `https://<owner>.github.io` |
| `BASE_PATH` | `/hawky-blog-demo` | `/<repo name>` |

Internal links in pages go through `withBase()` in `src/lib/url.ts`, which builds them from `import.meta.env.BASE_URL`. Renaming the repo needs no code change.

## Deploy

Enable Pages once: **Settings > Pages > Build and deployment > Source = "GitHub Actions"**. Without this, the deploy job fails.

After that, every push to `main` builds and deploys the site.

## Workflows

### Deploy blog (`.github/workflows/deploy.yml`)

Triggers on push to `main` and on `workflow_dispatch`. It runs `npm ci` and `npm run build`, uploads `dist/` as a Pages artifact, then deploys it with `actions/deploy-pages`. The run summary records the event, the actor, the commit and the reason.

| Input | Type | Required | Description |
|---|---|---|---|
| `reason` | string | no | Why this deploy was triggered, e.g. from Twenty CRM |

### CRM ping (`.github/workflows/crm-ping.yml`)

`workflow_dispatch` only. One job that writes its inputs into the run summary. It is the cheapest workflow to trigger, so use it to check that the CRM can reach GitHub before wiring up deploys.

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `message` | string | yes | `Hello from Twenty` | Message to echo |
| `recordId` | string | no | | Twenty record id that triggered the run |

### Triggering from the API

Both workflows can be dispatched with a token that has `actions: write` on this repo:

```bash
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/<owner>/<repo>/actions/workflows/crm-ping.yml/dispatches \
  -d '{"ref":"main","inputs":{"message":"Hello from Twenty","recordId":"abc123"}}'
```

Committing a new post with `PUT /repos/<owner>/<repo>/contents/src/content/blog/<slug>.md` (needs `contents: write`) pushes to `main`, which triggers a deploy on its own.
