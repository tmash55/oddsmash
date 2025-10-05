/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // enable SWC-based minifier (required for removeConsole to work)
  swcMinify: true,

  // drop all console.* calls when NODE_ENV=production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    domains: [
      // NextJS <Image> component needs to whitelist domains for src={}
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
      "avatar.vercel.sh",
      "randomuser.me",
      "img.mlbstatic.com",
      "static.www.nfl.com",
    ],
  },
};

module.exports = nextConfig;
