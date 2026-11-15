/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    PIGGYBANK_API_URL:
      process.env.PIGGYBANK_API_URL || "http://localhost:8000/api/v1",
    PUBLIC_GOOGLE_CLIENT_ID: process.env.PUBLIC_GOOGLE_CLIENT_ID || "",
    PUBLIC_GA_MEASUREMENT_ID:
      process.env.PUBLIC_GA_MEASUREMENT_ID ||
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
      "",
    PUBLIC_ENABLE_DEV_LOGIN:
      process.env.PUBLIC_ENABLE_DEV_LOGIN ??
      (process.env.NODE_ENV === "development" ? "true" : "false"),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
