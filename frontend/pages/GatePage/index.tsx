import Header from '@components/Header';
import Card from '@components/Card';

export default function GatePage(){
	return (
		<>
			<style>{`
				/* Mobile scroll fix for Gate page */
				@media (max-width: 768px) {
					body {
						overflow-y: auto !important;
						overflow-x: hidden !important;
						-webkit-overflow-scrolling: touch;
					}
					
					.container {
						overflow: visible !important;
						padding-bottom: 2rem;
					}
				}
			`}</style>
			<Header />
			<main className="container">
				<Card title="Gate">
					Trang demo cổng vào/ra (đang phát triển...)
				</Card>
			</main>
		</>
	);
}
