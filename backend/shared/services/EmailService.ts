import nodemailer from 'nodemailer';
import { appConfig } from '../config/database';

export interface EmailConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
}

export interface EmailTemplate {
	subject: string;
	html: string;
	text: string;
}

export class EmailService {
	private transporter: nodemailer.Transporter;

	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.SMTP_PORT || '587'),
			secure: process.env.SMTP_SECURE === 'true',
			auth: {
				user: process.env.SMTP_USER || '',
				pass: process.env.SMTP_PASS || ''
			}
		});
	}

	async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
		try {
			const info = await this.transporter.sendMail({
				from: `"Smartlog Depot Management" <${process.env.SMTP_USER}>`,
				to,
				subject,
				html,
				text: text || this.stripHtml(html)
			});

			console.log('Email sent successfully:', info.messageId);
			return true;
		} catch (error) {
			console.error('Failed to send email:', error);
			return false;
		}
	}

	async sendUserInvitation(
		email: string, 
		fullName: string, 
		role: string, 
		inviteToken: string,
		inviteExpiresAt: Date,
		language: 'vi' | 'en' = 'vi'
	): Promise<boolean> {
		const template = this.getUserInvitationTemplate(fullName, role, inviteToken, inviteExpiresAt, language);
		return await this.sendEmail(email, template.subject, template.html, template.text);
	}

	private getUserInvitationTemplate(
		fullName: string, 
		role: string, 
		inviteToken: string, 
		inviteExpiresAt: Date,
		language: 'vi' | 'en'
	): EmailTemplate {
		const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5002';
		const registerUrl = `${baseUrl}/Register?token=${inviteToken}`;
		const expiresDate = inviteExpiresAt.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
		
		if (language === 'vi') {
			return {
				subject: 'Lời mời tham gia Smartlog Depot Management',
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<title>Lời mời tham gia Smartlog Depot Management</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
							.container { max-width: 600px; margin: 0 auto; padding: 20px; }
							.header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
							.content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
							.button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
							.footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
							.token { background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<h1>Smartlog Depot Management</h1>
							</div>
							<div class="content">
								<h2>Xin chào ${fullName}!</h2>
								<p>Bạn đã được mời tham gia hệ thống <strong>Smartlog Depot Management</strong> với vai trò <strong>${role}</strong>.</p>
								
								<p>Để kích hoạt tài khoản của bạn, vui lòng nhấn vào nút bên dưới:</p>
								
								<div style="text-align: center;">
									<a href="${registerUrl}" class="button">Kích hoạt tài khoản</a>
								</div>
								
								<p><strong>Hoặc sao chép link sau vào trình duyệt:</strong></p>
								<div class="token">${registerUrl}</div>
								
								<p><strong>Token kích hoạt:</strong></p>
								<div class="token">${inviteToken}</div>
								
								<p><strong>Lưu ý quan trọng:</strong></p>
								<ul>
									<li>Link kích hoạt sẽ hết hạn vào: <strong>${expiresDate}</strong></li>
									<li>Vui lòng đặt mật khẩu mạnh khi kích hoạt tài khoản</li>
									<li>Nếu bạn không yêu cầu tài khoản này, vui lòng bỏ qua email này</li>
								</ul>
								
								<p>Nếu bạn gặp vấn đề, vui lòng liên hệ với quản trị viên hệ thống.</p>
							</div>
							<div class="footer">
								<p>Email này được gửi tự động từ hệ thống Smartlog Depot Management</p>
								<p>Vui lòng không trả lời email này</p>
							</div>
						</div>
					</body>
					</html>
				`,
				text: `
					Smartlog Depot Management - Lời mời tham gia
					
					Xin chào ${fullName}!
					
					Bạn đã được mời tham gia hệ thống Smartlog Depot Management với vai trò ${role}.
					
					Để kích hoạt tài khoản của bạn, vui lòng truy cập link sau:
					${registerUrl}
					
					Token kích hoạt: ${inviteToken}
					
					Link kích hoạt sẽ hết hạn vào: ${expiresDate}
					
					Vui lòng đặt mật khẩu mạnh khi kích hoạt tài khoản.
					Nếu bạn không yêu cầu tài khoản này, vui lòng bỏ qua email này.
					
					---
					Email này được gửi tự động từ hệ thống Smartlog Depot Management
				`
			};
		} else {
			return {
				subject: 'Invitation to join Smartlog Depot Management',
				html: `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<title>Invitation to join Smartlog Depot Management</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
							.container { max-width: 600px; margin: 0 auto; padding: 20px; }
							.header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
							.content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
							.button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
							.footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
							.token { background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
						</style>
					</head>
					<body>
						<div class="container">
							<div class="header">
								<h1>Smartlog Depot Management</h1>
							</div>
							<div class="content">
								<h2>Hello ${fullName}!</h2>
								<p>You have been invited to join <strong>Smartlog Depot Management</strong> with the role of <strong>${role}</strong>.</p>
								
								<p>To activate your account, please click the button below:</p>
								
								<div style="text-align: center;">
									<a href="${registerUrl}" class="button">Activate Account</a>
								</div>
								
								<p><strong>Or copy the following link to your browser:</strong></p>
								<div class="token">${registerUrl}</div>
								
								<p><strong>Activation Token:</strong></p>
								<div class="token">${inviteToken}</div>
								
								<p><strong>Important Notes:</strong></p>
								<ul>
									<li>Activation link expires on: <strong>${expiresDate}</strong></li>
									<li>Please set a strong password when activating your account</li>
									<li>If you did not request this account, please ignore this email</li>
								</ul>
								
								<p>If you encounter any issues, please contact the system administrator.</p>
							</div>
							<div class="footer">
								<p>This email was sent automatically from Smartlog Depot Management system</p>
								<p>Please do not reply to this email</p>
							</div>
						</div>
					</body>
					</html>
				`,
				text: `
					Smartlog Depot Management - Invitation to join
					
					Hello ${fullName}!
					
					You have been invited to join Smartlog Depot Management with the role of ${role}.
					
					To activate your account, please visit the following link:
					${registerUrl}
					
					Activation Token: ${inviteToken}
					
					Activation link expires on: ${expiresDate}
					
					Please set a strong password when activating your account.
					If you did not request this account, please ignore this email.
					
					---
					This email was sent automatically from Smartlog Depot Management system
				`
			};
		}
	}

	private stripHtml(html: string): string {
		return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
	}

	async verifyConnection(): Promise<boolean> {
		try {
			await this.transporter.verify();
			console.log('Email service connection verified successfully');
			return true;
		} catch (error) {
			console.error('Email service connection failed:', error);
			return false;
		}
	}
}

export default new EmailService();
