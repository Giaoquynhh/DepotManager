import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { connectDatabase, appConfig } from './shared/config/database';
import { authenticate } from './shared/middlewares/auth';
import { ChatWebSocket } from './modules/chat/websocket/ChatWebSocket';

// Routes
import authRoutes from './modules/auth/controller/authRoutes';
import userRoutes from './modules/users/controller/userRoutes';
import customerRoutes from './modules/customers/controller/customerRoutes';
import partnerRoutes from './modules/partners/controller/partnerRoutes';
import auditRoutes from './modules/audit/controller/auditRoutes';
import requestRoutes from './modules/requests/controller/RequestRoutes';
import documentRoutes from './modules/requests/controller/DocumentRoutes';
import requestStatusRoutes from './modules/requests/routes/RequestStatusRoutes';

import attachmentRoutes from './modules/requests/controller/AttachmentRoutes';
import chatRoutes from './modules/chat/controller/ChatRoutes';
import gateRoutes from './modules/gate/controller/GateRoutes';
import yardRoutes from './modules/yard/controller/YardRoutes';
import forkliftRoutes from './modules/forklift/controller/ForkliftRoutes';
import driverDashboardRoutes from './modules/driver-dashboard/controller/DriverDashboardRoutes';
import containerRoutes from './modules/containers/controller/ContainerRoutes';
import maintenanceRoutes from './modules/maintenance/controller/MaintenanceRoutes';
import financeRoutes from './modules/finance/controller/FinanceRoutes';
import reportsRoutes from './modules/reports/controller/ReportsRoutes';

const app = express();
const server = createServer(app);

app.use(helmet());
app.use(cors({
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);
		
		// Allow localhost and ngrok domains
		const allowedOrigins = [
			'http://localhost:3000',
			'http://localhost:5000',
			'http://localhost:5002',
			'https://localhost:3000',
			'https://localhost:5000',
			'https://localhost:5002'
		];
		
		// Allow ngrok domains (any domain ending with .ngrok.io or .ngrok-free.app)
		if (origin.includes('ngrok.io') || origin.includes('ngrok-free.app') || allowedOrigins.includes(origin)) {
			return callback(null, true);
		}
		
		callback(new Error('Not allowed by CORS'));
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Logging to file
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware for ngrok
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
	console.log('Headers:', req.headers);
	console.log('Origin:', req.headers.origin);
	console.log('User-Agent:', req.headers['user-agent']);
	next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/users', authenticate, userRoutes);
app.use('/customers', authenticate, customerRoutes);
app.use('/partners', authenticate, partnerRoutes);
app.use('/audit', authenticate, auditRoutes);
// Serve documents without authentication (public access)
app.use('/requests/documents', documentRoutes);
// All other request routes require authentication
app.use('/requests', authenticate, requestRoutes);
app.use('/requests', authenticate, requestStatusRoutes);

app.use('/requests', attachmentRoutes);

// Chat routes
app.use('/chat', authenticate, chatRoutes);
app.use('/gate', authenticate, gateRoutes);
app.use('/yard', yardRoutes);
app.use('/forklift', forkliftRoutes);
app.use('/driver-dashboard', driverDashboardRoutes);
app.use('/containers', containerRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/finance', financeRoutes);
app.use('/reports', reportsRoutes);

const start = async () => {
	await connectDatabase();
	
	// Initialize WebSocket
	const chatWebSocket = new ChatWebSocket(server);
	
	server.listen(appConfig.port, () => console.log(`[API] listening on ${appConfig.port}`));
};

start();

export default app;
