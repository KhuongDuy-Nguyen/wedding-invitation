import type { NextConfig } from "next";

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

const pagesBasePath = normalizeBasePath(process.env.PAGES_BASE_PATH);

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: pagesBasePath,
  allowedDevOrigins: ["*.ngrok-free.app"],
  env: {
    NEXT_PUBLIC_BASE_PATH: pagesBasePath,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
