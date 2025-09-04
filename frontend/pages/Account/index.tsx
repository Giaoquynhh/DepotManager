import Header from '@components/Header';
import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { api } from '@services/api';
import Card from '@components/Card';
import { useTranslation } from '@hooks/useTranslation';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function Account(){
    const { t } = useTranslation();
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
			setMsg(res.data?.message || t('pages.account.messages.updateSuccess'));
			mutate();
		}catch(e:any){ setMsg(e?.response?.data?.message || t('pages.account.messages.updateFailed')); }
	};

	const onChangePassword = async () => {
		setMsg('');
		try{
			await api.post('/auth/me/change-password', { old: pwd.old, new: pwd.New, confirm: pwd.confirm });
			setMsg(t('pages.account.messages.passwordChangeSuccess'));
			if (typeof window !== 'undefined'){
				localStorage.removeItem('token');
				localStorage.removeItem('refresh_token');
				setTimeout(()=>{ window.location.href = '/Login'; }, 1200);
			}
		}catch(e:any){ setMsg(e?.response?.data?.message || t('pages.account.messages.passwordChangeFailed')); }
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
								<span className="shimmer-text">👤 {t('pages.account.profile.title')}</span>
							</h2>
						</div>
						
						<div className="form-group">
							<div className="input-wrapper">
								<span className="input-icon">👤</span>
								<input 
									type="text" 
									placeholder={t('pages.account.profile.fullNamePlaceholder')} 
									value={form.full_name} 
									onChange={e=>setForm({...form, full_name:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="input-wrapper">
								<span className="input-icon">📧</span>
								<input 
									type="email" 
									placeholder={t('pages.account.profile.emailPlaceholder')} 
									value={form.email} 
									onChange={e=>setForm({...form, email:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="input-wrapper">
								<span className="input-icon">📱</span>
								<input 
									type="text" 
									placeholder={t('pages.account.profile.phonePlaceholder')} 
									value={form.phone} 
									onChange={e=>setForm({...form, phone:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="info-text">
								✨ {t('pages.account.profile.readonlyInfo')}
							</div>
							
							<button className="futuristic-btn primary-btn" onClick={onUpdate}>
								<span className="btn-text">{t('pages.account.profile.updateProfile')}</span>
								<div className="btn-ripple"></div>
							</button>
							
							{msg && <div className="success-message">✨ {msg}</div>}
						</div>
					</div>

					{/* Password Card */}
					<div className="glass-card password-card">
						<div className="card-header">
							<h2 className="card-title">
								<span className="shimmer-text">🔑 {t('pages.account.password.title')}</span>
							</h2>
						</div>
						
						<div className="form-group">
							<div className="input-wrapper">
								<span className="input-icon">🔒</span>
								<input 
									type="password" 
									placeholder={t('pages.account.password.oldPlaceholder')} 
									value={pwd.old} 
									onChange={e=>setPwd({...pwd, old:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="input-wrapper">
								<span className="input-icon">🔑</span>
								<input 
									type="password" 
									placeholder={t('pages.account.password.newPlaceholder')} 
									value={pwd.New} 
									onChange={e=>setPwd({...pwd, New:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="input-wrapper">
								<span className="input-icon">🔐</span>
								<input 
									type="password" 
									placeholder={t('pages.account.password.confirmPlaceholder')} 
									value={pwd.confirm} 
									onChange={e=>setPwd({...pwd, confirm:e.target.value})}
									className="futuristic-input"
								/>
							</div>
							
							<div className="info-text">
								🛡️ {t('pages.account.password.policy')}
							</div>
							
							<button className="futuristic-btn secondary-btn" onClick={onChangePassword}>
								<span className="btn-text">{t('pages.account.password.changePassword')}</span>
								<div className="btn-ripple"></div>
							</button>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
