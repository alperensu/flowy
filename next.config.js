/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export',  // DISABLED: Breaks API routes in dev mode. Re-enable for Electron build.
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn-images.dzcdn.net',
            },
            {
                protocol: 'https',
                hostname: 'e-cdns-images.dzcdn.net',
            },
            {
                protocol: 'https',
                hostname: 'api.deezer.com',
            },
            {
                protocol: 'https',
                hostname: 'i.pravatar.cc',
            },
            {
                protocol: 'https',
                hostname: 'www.google.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
        ],
    },
};

module.exports = nextConfig;
