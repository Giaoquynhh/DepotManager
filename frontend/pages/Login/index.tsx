import { useState } from 'react';
import type { FormEvent } from 'react';
import Header from '@components/Header';
import { api } from '@services/api';
import Link from 'next/link';
import { homeFor } from '@utils/rbac';

export default function Login(){
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

	const onLogin = async () => {
		if (loading) return;
		setError('');
		setLoading(true);
		try{
			const res = await api.post('/auth/login', { username: username.trim(), password });
			if (typeof window !== 'undefined'){
				localStorage.setItem('token', res.data.access_token);
				localStorage.setItem('refresh_token', res.data.refresh_token);
				localStorage.setItem('user_id', res.data.user._id || res.data.user.id);
				const dest = homeFor(res.data.user.role || res.data.user.roles?.[0]);
				window.location.href = dest;
			}
		}catch(e: any){
			const code = e?.response?.status;
			if (code === 423) setError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
			else setError('Tên đăng nhập hoặc mật khẩu không chính xác');
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!loading) onLogin();
	};

	return (
		<>
			<Header />
			<main className="futuristic-login">
				{/* Premium Marine Background */}
				<div className="navy-bg">
					<div className="navy-particles"></div>
					<div className="navy-waves"></div>
					<div className="navy-grid"></div>
					
					{/* 3D Marine Illustrations */}
					<div className="marine-illustrations">
						{/* Container Ship */}
						<div className="container-ship"></div>
						
						{/* Marine Crane */}
						<div className="marine-crane">🏗️</div>
						
						{/* Seagulls */}
						<div className="seagulls">
							<div className="seagull">🕊️</div>
							<div className="seagull">🕊️</div>
							<div className="seagull">🕊️</div>
						</div>
						
						{/* Lighthouse */}
						<div className="lighthouse"></div>
					</div>
					
					{/* Floating Containers */}
					<div className="floating-containers">
						<div className="floating-container" style={{left: '10%', animationDelay: '0s'}}>📦</div>
						<div className="floating-container" style={{left: '30%', animationDelay: '2s'}}>📦</div>
						<div className="floating-container" style={{left: '50%', animationDelay: '4s'}}>📦</div>
						<div className="floating-container" style={{left: '70%', animationDelay: '6s'}}>📦</div>
						<div className="floating-container" style={{left: '90%', animationDelay: '8s'}}>📦</div>
					</div>
					
					{/* Wave Sound Effect */}
					<div className="wave-sound-effect"></div>
				</div>

				{/* Login Container */}
				<div className="login-container">
					{/* Glass Login Card */}
					<div className="glass-login-card">
						{/* Card Header */}
						<div className="login-header">
							<div className="logo-container">
								<div className="navy-logo">
									<span className="logo-icon">📦</span>
								</div>
							</div>
							<h1 className="login-title">
								<span className="shimmer-text">ĐĂNG NHẬP</span>
							</h1>
							<p className="login-subtitle">
								⚓ Nhập thông tin để truy cập hệ thống quản lý container toàn cầu
							</p>
						</div>

						{/* Login Form */}
						<form className="futuristic-form" onSubmit={handleSubmit} noValidate>
							{/* Username Field */}
							<div className="input-group">
								<label className="navy-label" htmlFor="login-username">
									📧 Email / Tên đăng nhập
								</label>
								<div className="navy-input-wrapper">
									<span className="navy-input-icon">📧</span>
									<input 
										id="login-username" 
										name="username" 
										type="text" 
										placeholder="email@company.com" 
										autoComplete="username" 
										value={username} 
										onChange={e=>setUsername(e.target.value)} 
										disabled={loading}
										className="navy-input"
									/>
								</div>
							</div>

							{/* Password Field */}
							<div className="input-group">
								<label className="navy-label" htmlFor="login-password">
									🔐 Mật khẩu
								</label>
								<div className="navy-input-wrapper">
									<span className="navy-input-icon">🔒</span>
									<input 
										id="login-password" 
										name="password" 
										type={showPassword ? 'text' : 'password'} 
										placeholder="••••••••" 
										autoComplete="current-password" 
										value={password} 
										onChange={e=>setPassword(e.target.value)} 
										disabled={loading}
										className="navy-input"
									/>
									<button 
										type="button" 
										className="navy-toggle-btn" 
										onClick={() => setShowPassword(v => !v)} 
										aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} 
										disabled={loading}
									>
										{showPassword ? '🙈' : '👁️'}
									</button>
								</div>
							</div>

							{/* Error Message */}
							{error && (
								<div className="navy-error">
									<span className="error-icon">⚠️</span>
									{error}
								</div>
							)}

							{/* Login Button */}
							<button 
								className="navy-login-btn" 
								type="submit" 
								disabled={loading} 
								aria-busy={loading}
							>
								<span className="btn-content">
									{loading ? (
										<>
											<span className="loading-spinner"></span>
											Đang đăng nhập...
										</>
									) : (
										<>
											ĐĂNG NHẬP
										</>
									)}
								</span>
								<div className="btn-ripple"></div>
							</button>

							{/* Register Link */}
							<div className="navy-auth-link">
								<span className="link-text">Chưa có mật khẩu?</span>
								<Link href="/Register" className="navy-link">
									📋 Kích hoạt tài khoản (Accept Invite)
								</Link>
							</div>
						</form>
					</div>
				</div>
			</main>
		</>
	);
}
