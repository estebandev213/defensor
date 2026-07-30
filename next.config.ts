import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { securityHeaders } from "@/server/security/headers";

export default function createNextConfig(phase: string): NextConfig {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    poweredByHeader: false,
    reactStrictMode: true,
    async headers() {
      return [{ source: "/(.*)", headers: securityHeaders() }];
    },
    async redirects() {
      return [
        {
          source: "/derechos-laborales",
          destination: "/#temas-principales",
          permanent: true,
        },
      ];
    },
  };
}
