import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // pos_design/ and docs/ are reference material — never trace them into the build.
  outputFileTracingExcludes: { "*": ["./pos_design/**", "./docs/**"] },
};

export default withNextIntl(nextConfig);
