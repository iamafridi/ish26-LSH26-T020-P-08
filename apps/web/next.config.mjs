/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  outputFileTracingIncludes: {
    "/*": ["../../P08_school_results_public.json", "../../config/rules.json"],
  },
};

export default nextConfig;
