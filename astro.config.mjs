// @ts-check
import { defineConfig } from 'astro/config';

// SITE and BASE_PATH are set by the deploy workflow so the build works at
// https://<user>.github.io/<repo>/. The defaults match this repo's name.
const site = process.env.SITE || 'https://example.github.io';
const base = process.env.BASE_PATH || '/hawky-blog-demo';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
});
