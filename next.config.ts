import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * Honest about its limits: `script-src` has to allow 'unsafe-inline' because
 * Next streams hydration data in inline <script> tags and the theme is applied
 * by an inline script before first paint. Locking that down means per-request
 * nonces, which would opt every page out of static rendering for a portfolio
 * that has no user-generated HTML anywhere (React escapes everything, and the
 * one inline script is a constant). So the real wins here are the other
 * directives: nothing can frame the site, no plugins, no injected <base>, and
 * scripts/styles/fetches can't come from another origin.
 *
 * Dev needs two extra allowances: Turbopack compiles with eval, and HMR talks
 * over a websocket.
 */
const csp = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' lets the ML Lab compile the onnxruntime WebAssembly
  // runtime. It gates only WebAssembly.compile/instantiate, not JS eval. Dev
  // works without it (Turbopack's 'unsafe-eval' implies it), so dropping it
  // would break production only; keep it unconditional.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Local assets, plus the two origins the GitHub and Spotify panels serve
  // remote artwork from. blob:/data: cover canvas and inline SVG.
  "img-src 'self' data: blob: https://avatars.githubusercontent.com https://i.scdn.co",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // frame-ancestors covers modern browsers; this is the legacy belt-and-braces.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Vercel already sends HSTS; restated so a non-Vercel host gets it too.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, a stray lockfile in a
  // parent dir ($HOME) makes Turbopack pick the wrong root, which desyncs the
  // client/server manifests and throws intermittent 500s ("Could not find the
  // module … in the React Client Manifest"). process.cwd() is the project root
  // both locally (`npm run dev` from here) and on Vercel.
  turbopack: { root: process.cwd() },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Model files and the onnxruntime wasm are multi-megabyte static assets
      // that public/ would otherwise serve with max-age=0. Their filenames are
      // versioned (model-digits-v1.onnx, ort/<version>/...), so immutable is
      // safe: a new model is a new URL. ":path+" (not "*") keeps the /ml HTML
      // page itself out of this rule.
      {
        source: "/ml/:path+",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
