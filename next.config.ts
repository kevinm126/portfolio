import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, a stray lockfile in a
  // parent dir ($HOME) makes Turbopack pick the wrong root, which desyncs the
  // client/server manifests and throws intermittent 500s ("Could not find the
  // module … in the React Client Manifest"). process.cwd() is the project root
  // both locally (`npm run dev` from here) and on Vercel.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
