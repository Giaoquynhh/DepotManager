import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import '../styles/globals.css';
import '../styles/chat-mini.css';
import '../styles/appointment-mini.css';
import '../styles/supplement-mini.css';
import '../styles/gate.css';
import '../styles/depot-table.css';
import '../styles/yard/futuristic-modal.css';
import DriverNotification from '@components/DriverNotification';


export default function MyApp({ Component, pageProps }: AppProps) {
	const [userInfo, setUserInfo] = useState<{ id: string; role: string } | null>(null);

	useEffect(() => {
		// Get user info from localStorage or API
		const token = localStorage.getItem('token');
		if (token) {
			// You can also fetch user info from API here
			const userId = localStorage.getItem('user_id');
			const userRole = localStorage.getItem('user_role');
			if (userId && userRole) {
				setUserInfo({ id: userId, role: userRole });
			}
		}
	}, []);

	return (
		<>
			<Head>
				<title>Smartlog Container Manager</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</Head>
			<Component {...pageProps} />
			{userInfo && (
				<DriverNotification 
					userId={userInfo.id} 
					userRole={userInfo.role} 
				/>
			)}
		</>
	);
}
