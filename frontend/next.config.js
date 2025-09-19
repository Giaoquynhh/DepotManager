/**** Next.js config ****/
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: { unoptimized: true },
	onDemandEntries: {
		maxInactiveAge: 25 * 1000,
		pagesBufferLength: 2,
	},
	// Tắt error overlay trong development
	devIndicators: {
		buildActivity: false,
		buildActivityPosition: 'bottom-right',
	},
	// Tắt error overlay
	experimental: {
		esmExternals: false,
	},
	rewrites: async () => ([
		{
			source: '/backend/:path*',
			destination: 'http://localhost:1000/:path*'
		}
	])
};

module.exports = nextConfig;
