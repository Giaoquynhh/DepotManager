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
		position: 'bottom-right',
	},
	rewrites: async () => {
		// Nếu có BACKEND_URL (ngrok), sử dụng nó
		// Nếu không, mặc định là localhost:1000
		const backendUrl = process.env.BACKEND_URL || 'http://localhost:1000';
		
		return [
			{
				source: '/backend/:path*',
				destination: `${backendUrl}/:path*`
			}
		];
	}
};

module.exports = nextConfig;
