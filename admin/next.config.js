/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevents build-time errors when environment variables are not present
  // during the static analysis phase of the build
  experimental: {},
};

module.exports = nextConfig;
