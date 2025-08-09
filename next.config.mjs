/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // Set this to false to terminate the build instead.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
