import { Request, Response } from 'express';
import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';
import { AuthRequest } from '../../../shared/middlewares/auth';

export class ForkliftController {
	async listJobs(req: Request, res: Response) {
		try {
			const jobs = await prisma.forkliftTask.findMany({
				orderBy: {
					createdAt: 'desc'
				}
			});

			// Get driver information for each job
			const jobsWithDrivers = await Promise.all(
				jobs.map(async (job) => {
					let driver = null;
					if (job.assigned_driver_id) {
						driver = await prisma.user.findUnique({
							where: { id: job.assigned_driver_id },
							select: {
								id: true,
								full_name: true,
								email: true
							}
						});
					}
					return {
						...job,
						driver
					};
				})
			);

			return res.json({
				success: true,
				data: jobsWithDrivers
			});
		} catch (error) {
			console.error('Error listing forklift jobs:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}

	async assignDriver(req: AuthRequest, res: Response) {
		try {
			const { jobId } = req.params;
			const { driver_id } = req.body;

			if (!driver_id) {
				return res.status(400).json({ message: 'Driver ID is required' });
			}

			// Check if job exists
			const job = await prisma.forkliftTask.findUnique({
				where: { id: jobId }
			});

			if (!job) {
				return res.status(404).json({ message: 'Forklift job not found' });
			}

			// Check if driver exists and is active
			const driver = await prisma.user.findFirst({
				where: {
					id: driver_id,
					role: 'Driver',
					status: 'ACTIVE'
				}
			});

			if (!driver) {
				return res.status(404).json({ message: 'Driver not found or not active' });
			}

			// Update job with driver assignment
			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: {
					assigned_driver_id: driver_id
				}
			});

			// Get slot information for notification
			const fromSlot = job.from_slot_id ? await prisma.yardSlot.findUnique({
				where: { id: job.from_slot_id }
			}) : null;

			const toSlot = job.to_slot_id ? await prisma.yardSlot.findUnique({
				where: { id: job.to_slot_id }
			}) : null;

			// Send WebSocket notification to driver
			try {
				const notification = {
					type: 'FORKLIFT_ASSIGNMENT',
					title: 'Bạn được gán công việc xe nâng mới',
					message: `Container ${job.container_no} cần di chuyển từ ${fromSlot?.code || 'Vị trí nguồn'} đến ${toSlot?.code || 'Vị trí đích'}`,
					data: {
						job_id: jobId,
						container_no: job.container_no,
						source_location: fromSlot?.code || 'Vị trí nguồn',
						destination_location: toSlot?.code || 'Vị trí đích',
						assigned_by: req.user?.email || 'System'
					},
					timestamp: new Date().toISOString()
				};

				// TODO: Implement WebSocket notification
				console.log('WebSocket notification:', notification);

			} catch (wsError) {
				console.error('WebSocket notification failed:', wsError);
				// Don't fail the request if WebSocket fails
			}

			// Audit log
			await audit(req.user!._id, 'FORKLIFT_DRIVER_ASSIGNED', 'FORKLIFT_TASK', jobId, {
				driver_id,
				driver_name: driver.full_name,
				container_no: job.container_no
			});

			return res.json({
				success: true,
				message: 'Driver assigned successfully',
				data: {
					...updatedJob,
					driver: {
						id: driver.id,
						full_name: driver.full_name,
						email: driver.email
					}
				}
			});

		} catch (error) {
			console.error('Error assigning driver:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}

	async startJob(req: AuthRequest, res: Response) {
		try {
			const { jobId } = req.params;

			const job = await prisma.forkliftTask.findUnique({
				where: { id: jobId }
			});

			if (!job) {
				return res.status(404).json({ message: 'Forklift job not found' });
			}

			if (job.status !== 'PENDING') {
				return res.status(400).json({ message: 'Job is not in pending status' });
			}

			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: {
					status: 'IN_PROGRESS'
				}
			});

			await audit(req.user!._id, 'FORKLIFT_JOB_STARTED', 'FORKLIFT_TASK', jobId);

			return res.json({
				success: true,
				message: 'Job started successfully',
				data: updatedJob
			});

		} catch (error) {
			console.error('Error starting job:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}

	async completeJob(req: AuthRequest, res: Response) {
		try {
			const { jobId } = req.params;

			const job = await prisma.forkliftTask.findUnique({
				where: { id: jobId }
			});

			if (!job) {
				return res.status(404).json({ message: 'Forklift job not found' });
			}

			if (job.status !== 'IN_PROGRESS') {
				return res.status(400).json({ message: 'Job is not in progress' });
			}

			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: {
					status: 'COMPLETED'
				}
			});

			await audit(req.user!._id, 'FORKLIFT_JOB_COMPLETED', 'FORKLIFT_TASK', jobId);

			return res.json({
				success: true,
				message: 'Job completed successfully',
				data: updatedJob
			});

		} catch (error) {
			console.error('Error completing job:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}

	async cancelJob(req: AuthRequest, res: Response) {
		try {
			const { jobId } = req.params;
			const { reason } = req.body;

			const job = await prisma.forkliftTask.findUnique({
				where: { id: jobId }
			});

			if (!job) {
				return res.status(404).json({ message: 'Forklift job not found' });
			}

			if (job.status === 'COMPLETED') {
				return res.status(400).json({ message: 'Cannot cancel completed job' });
			}

			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: {
					status: 'CANCELLED',
					cancel_reason: reason
				}
			});

			await audit(req.user!._id, 'FORKLIFT_JOB_CANCELLED', 'FORKLIFT_TASK', jobId, { reason });

			return res.json({
				success: true,
				message: 'Job cancelled successfully',
				data: updatedJob
			});

		} catch (error) {
			console.error('Error cancelling job:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}
}

export default new ForkliftController();


