import Header from '@components/Header';
import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { api } from '@services/api';
import Card from '@components/Card';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function Account(){
	const { data, mutate } = useSWR('/auth/me', fetcher);
	const [form, setForm] = useState({ full_name:'', email:'', phone:'' });
	const [msg, setMsg] = useState('');
	const [pwd, setPwd] = useState({ old:'', New:'', confirm:'' });

	useEffect(()=>{
		if (data){
			setForm({ full_name: data.full_name||'', email: data.email||'', phone: data.phone||'' });
		}
	}, [data]);

	const onUpdate = async () => {
		setMsg('');
		try{
			const payload: any = { full_name: form.full_name, phone: form.phone };
			if (form.email && form.email !== data?.email) payload.email = form.email;
			const res = await api.patch('/auth/me', payload);
			setMsg(res.data?.message || 'Cập nhật thông tin thành công');
			mutate();
		}catch(e:any){ setMsg(e?.response?.data?.message || 'Cập nhật thất bại'); }
	};

	const onChangePassword = async () => {
		setMsg('');
		try{
			await api.post('/auth/me/change-password', { old: pwd.old, new: pwd.New, confirm: pwd.confirm });
			setMsg('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
			if (typeof window !== 'undefined'){
				localStorage.removeItem('token');
				localStorage.removeItem('refresh_token');
				setTimeout(()=>{ window.location.href = '/Login'; }, 1200);
			}
		}catch(e:any){ setMsg(e?.response?.data?.message || 'Đổi mật khẩu thất bại'); }
	};

	return (
		<>
			<Header />
			<main className="container futuristic-profile">
				{/* Animated Background */}
				<div className="futuristic-bg">
					<div className="particles"></div>
					<div className="waves"></div>
				</div>

				{/* Main Content */}
				<div className="profile-container">
					{/* Profile Card */}
					<div className="glass-card profile-card">
						<div className="card-header">
							<h2 className="card-title">
								<span className="shimmer-text">👤 Hồ sơ cá nhân</span>
							</h2>
						</div>
						
						<div className="form-group">
							<div className="input-wrapper">
								<span className="input-icon">👤</span>
								<input 
									type="text" 
									placeholder="Họ tên" 
									value={form.full_name} 
									onChange={e=>setForm({...form, full_name:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="input-wrapper">
								<span className="input-icon">📧</span>
								<input 
									type="email" 
									placeholder="Email" 
									value={form.email} 
									onChange={e=>setForm({...form, email:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="input-wrapper">
								<span className="input-icon">📱</span>
								<input 
									type="text" 
									placeholder="Điện thoại" 
									value={form.phone} 
									onChange={e=>setForm({...form, phone:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="info-text">
								✨ Trường chỉ đọc: role, tenant/partner. Đổi email/phone có thể yêu cầu xác minh.
							</div>
							
							<button className="futuristic-btn primary-btn" onClick={onUpdate}>
								<span className="btn-text">Cập nhật hồ sơ</span>
								<div className="btn-ripple"></div>
							</button>
							
							{msg && <div className="success-message">✨ {msg}</div>}
						</div>
					</div>

					{/* Password Card */}
					<div className="glass-card password-card">
						<div className="card-header">
							<h2 className="card-title">
								<span className="shimmer-text">🔑 Đổi mật khẩu</span>
							</h2>
						</div>
						
						<div className="form-group">
							<div className="input-wrapper">
								<span className="input-icon">🔒</span>
								<input 
									type="password" 
									placeholder="Mật khẩu cũ" 
									value={pwd.old} 
									onChange={e=>setPwd({...pwd, old:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="input-wrapper">
								<span className="input-icon">🔑</span>
								<input 
									type="password" 
									placeholder="Mật khẩu mới" 
									value={pwd.New} 
									onChange={e=>setPwd({...pwd, New:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="input-wrapper">
								<span className="input-icon">🔐</span>
								<input 
									type="password" 
									placeholder="Xác nhận mật khẩu mới" 
									value={pwd.confirm} 
									onChange={e=>setPwd({...pwd, confirm:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="info-text">
								🛡️ Mật khẩu ≥ 8 ký tự, gồm số, chữ hoa, ký tự đặc biệt, và khác mật khẩu cũ.
							</div>
							
							<button className="futuristic-btn secondary-btn" onClick={onChangePassword}>
								<span className="btn-text">Đổi mật khẩu</span>
								<div className="btn-ripple"></div>
							</button>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
