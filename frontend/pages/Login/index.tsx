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
			<main className="auth-hero">
				<div className="auth-card">
					<div className="section-head">
						<h2>Đăng nhập</h2>
						<p className="muted">Nhập thông tin để truy cập hệ thống</p>
					</div>
					<form className="form-grid" onSubmit={handleSubmit} noValidate>
						<div>
							<label className="field-label" htmlFor="login-username">Email / Tên đăng nhập</label>
							<div className="input-icon">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
									<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5"/>
									<path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
								<input id="login-username" name="username" type="text" placeholder="email@company.com" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} disabled={loading} />
							</div>
						</div>
						<div>
							<label className="field-label" htmlFor="login-password">Mật khẩu</label>
							<div className="input-icon has-action">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
									<rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
									<path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
								</svg>
								<input id="login-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={loading} />
								<button type="button" className="input-action" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} disabled={loading}>
									{showPassword ? (
										/* Eye-off icon */
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
											<path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
											<path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
											<path d="M7.11 7.11C5.15 8.26 3.6 10 2 12c2.5 3.5 6 6 10 6 1.54 0 3-.33 4.32-.93M16.89 16.89C19 15.7 20.85 13.98 22 12c-2.5-3.5-6-6-10-6-1.04 0-2.05.16-3 .46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
										</svg>
									) : (
										/* Eye icon */
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
											<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
											<circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
										</svg>
									)}
								</button>
							</div>
						</div>
						{error && <div className="form-error">{error}</div>}
						<button className="btn btn-login" type="submit" disabled={loading} aria-busy={loading}>
							{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
						</button>
						<div className="auth-link">
							Chưa có mật khẩu? <Link href="/Register">Kích hoạt tài khoản (Accept Invite)</Link>
						</div>
					</form>
				</div>
			</main>
		</>
	);
}
