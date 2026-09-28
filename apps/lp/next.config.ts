import type { NextConfig } from 'next';

// A static export: Cloudflare Pages serves the `out/` folder and nothing runs
// on a server. Every route must build to a file, so no route handlers.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
