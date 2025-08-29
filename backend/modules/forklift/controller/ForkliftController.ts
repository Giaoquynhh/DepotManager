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

			// Get driver information and container details for each job
			const jobsWithDetails = await Promise.all(
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

					// Get container information including driver name and license plate
					let containerInfo = null;
					try {
						containerInfo = await prisma.serviceRequest.findFirst({
							where: { container_no: job.container_no },
							select: {
								driver_name: true,
								license_plate: true,
								status: true,
								type: true
							},
							orderBy: { createdAt: 'desc' }
						});
					} catch (error) {
						console.log(`Could not find container info for ${job.container_no}:`, error);
					}

					// Get actual container location from yard
					let actualLocation = null;
					try {
						actualLocation = await prisma.yardPlacement.findFirst({
							where: { 
								container_no: job.container_no, 
								status: { in: ['HOLD', 'OCCUPIED'] } 
							},
							include: { 
								slot: { 
									include: { 
										block: { 
											include: { 
												yard: true 
											} 
										} 
									} 
								} 
							}
						});
					} catch (error) {
						console.log(`Could not find actual location for ${job.container_no}:`, error);
					}

					return {
						...job,
						driver,
						container_info: containerInfo,
						actual_location: actualLocation
					};
				})
			);

			return res.json({
				success: true,
				data: jobsWithDetails
			});
		} catch (error) {
			console.error('Error listing forklift jobs:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}

	async getJobsByDriver(req: Request, res: Response) {
		try {
			const { driverId } = req.params;

			// Get jobs assigned to specific driver
			const jobs = await prisma.forkliftTask.findMany({
				where: {
					assigned_driver_id: driverId
				},
				orderBy: {
					createdAt: 'desc'
				}
			});

			// Get detailed information for each job
			const jobsWithDetails = await Promise.all(
				jobs.map(async (job) => {
					// Get container information
					let containerInfo = null;
					try {
						containerInfo = await prisma.serviceRequest.findFirst({
							where: { container_no: job.container_no },
							select: {
								driver_name: true,
								license_plate: true,
								status: true,
								type: true
							},
							orderBy: { createdAt: 'desc' }
						});
					} catch (error) {
						console.log(`Could not find container info for ${job.container_no}:`, error);
					}

					// Get source location details
					let fromLocation = null;
					if (job.from_slot_id) {
						try {
							fromLocation = await prisma.yardSlot.findUnique({
								where: { id: job.from_slot_id },
								include: {
									block: {
										include: {
											yard: true
										}
									}
								}
							});
						} catch (error) {
							console.log(`Could not find from location for job ${job.id}:`, error);
						}
					}

					// Get destination location details
					let toLocation = null;
					if (job.to_slot_id) {
						try {
							toLocation = await prisma.yardSlot.findUnique({
								where: { id: job.to_slot_id },
								include: {
									block: {
										include: {
											yard: true
										}
									}
								}
							});
						} catch (error) {
							console.log(`Could not find to location for job ${job.id}:`, error);
						}
					}

					// Get actual container location from yard
					let actualLocation = null;
					try {
						actualLocation = await prisma.yardPlacement.findFirst({
							where: { 
								container_no: job.container_no, 
								status: { in: ['HOLD', 'OCCUPIED'] } 
							},
							include: { 
								slot: { 
									include: { 
										block: { 
											include: { 
												yard: true 
											} 
										} 
									} 
								} 
							}
						});
					} catch (error) {
						console.log(`Could not find actual location for ${job.container_no}:`, error);
					}

					return {
						...job,
						container_info: containerInfo,
						from_location: fromLocation,
						to_location: toLocation,
						actual_location: actualLocation
					};
				})
			);

			return res.json({
				success: true,
				data: jobsWithDetails
			});
		} catch (error) {
			console.error('Error getting jobs by driver:', error);
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

			// Check if job can be assigned (only PENDING status can be assigned)
			if (job.status !== 'PENDING') {
				return res.status(400).json({ message: 'Job cannot be assigned. Only pending jobs can be assigned to drivers.' });
			}

			// If job already has a driver, we're reassigning (this is allowed)
			const isReassignment = job.assigned_driver_id && job.assigned_driver_id !== driver_id;

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

			// Update job with driver assignment but keep status as PENDING
			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: {
					assigned_driver_id: driver_id
					// Status remains PENDING until driver starts the job
				}
			});

			// Get slot information for notification
			const fromSlot = job.from_slot_id ? await prisma.yardSlot.findUnique({
				where: { id: job.from_slot_id }
			}) : null;

			// Get actual container location from yard
			const actualLocation = await prisma.yardPlacement.findFirst({
				where: { 
					container_no: job.container_no, 
					status: { in: ['HOLD', 'OCCUPIED'] } 
				},
				include: { 
					slot: { 
						include: { 
							block: { 
								include: { 
									yard: true 
								} 
							} 
						} 
					} 
				}
			});

			const toSlot = job.to_slot_id ? await prisma.yardSlot.findUnique({
				where: { id: job.to_slot_id }
			}) : null;

			// Send WebSocket notification to new driver
			try {
				const destinationLocation = actualLocation ? 
					`${actualLocation.slot.code} (Tier ${actualLocation.tier})` : 
					(toSlot?.code || 'Vị trí đích');

				const notification = {
					type: 'FORKLIFT_ASSIGNMENT',
					title: isReassignment ? 'Bạn được gán lại công việc xe nâng' : 'Bạn được gán công việc xe nâng mới',
					message: `Container ${job.container_no} cần di chuyển từ ${fromSlot?.code || 'Vị trí nguồn'} đến ${destinationLocation}`,
					data: {
						job_id: jobId,
						container_no: job.container_no,
						source_location: fromSlot?.code || 'Vị trí nguồn',
						destination_location: destinationLocation,
						assigned_by: req.user?.email || 'System',
						is_reassignment: isReassignment
					},
					timestamp: new Date().toISOString()
				};

				// TODO: Implement WebSocket notification
				console.log('WebSocket notification to new driver:', notification);

			} catch (wsError) {
				console.error('WebSocket notification failed:', wsError);
				// Don't fail the request if WebSocket fails
			}

			// If this is a reassignment, send notification to old driver
			if (isReassignment && job.assigned_driver_id) {
				try {
					const oldDriverNotification = {
						type: 'FORKLIFT_REASSIGNMENT',
						title: 'Công việc xe nâng đã được gán lại',
						message: `Container ${job.container_no} đã được gán cho tài xế khác`,
						data: {
							job_id: jobId,
							container_no: job.container_no,
							old_driver_id: job.assigned_driver_id,
							new_driver_id: driver_id,
							reassigned_by: req.user?.email || 'System'
						},
						timestamp: new Date().toISOString()
					};

					// TODO: Implement WebSocket notification to old driver
					console.log('WebSocket notification to old driver:', oldDriverNotification);

				} catch (wsError) {
					console.error('WebSocket notification to old driver failed:', wsError);
				}
			}
			

			// Audit log
			await audit(req.user!._id, 'FORKLIFT_DRIVER_ASSIGNED', 'FORKLIFT_TASK', jobId, {
				driver_id,
				driver_name: driver.full_name,
				container_no: job.container_no,
				actual_location: actualLocation ? {
					slot_code: actualLocation.slot.code,
					tier: actualLocation.tier,
					block_code: actualLocation.slot.block.code,
					yard_name: actualLocation.slot.block.yard.name
				} : null
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

			// Check if job has a driver assigned and is in PENDING status
			if (!job.assigned_driver_id) {
				return res.status(400).json({ message: 'Job must be assigned to a driver before starting' });
			}

			if (job.status !== 'PENDING') {
				return res.status(400).json({ message: 'Job must be in pending status to start' });
			}

			// Update job status to ASSIGNED when driver starts
			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: {
					status: 'ASSIGNED'
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

	async beginWork(req: AuthRequest, res: Response) {
		try {
			const { jobId } = req.params;

			const job = await prisma.forkliftTask.findUnique({
				where: { id: jobId }
			});

			if (!job) {
				return res.status(404).json({ message: 'Forklift job not found' });
			}

			// Check if job is in ASSIGNED status and has a driver
			if (job.status !== 'ASSIGNED') {
				return res.status(400).json({ message: 'Job must be in assigned status to begin work' });
			}

			if (!job.assigned_driver_id) {
				return res.status(400).json({ message: 'Job must have a driver assigned' });
			}

			// Update job status to IN_PROGRESS when driver begins actual work
			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: {
					status: 'IN_PROGRESS'
				}
			});

			await audit(req.user!._id, 'FORKLIFT_WORK_BEGUN', 'FORKLIFT_TASK', jobId);

			return res.json({
				success: true,
				message: 'Work begun successfully',
				data: updatedJob
			});

		} catch (error) {
			console.error('Error beginning work:', error);
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

			if (job.status !== 'IN_PROGRESS' && job.status !== 'PENDING' && job.status !== 'ASSIGNED') {
				return res.status(400).json({ message: 'Job is not in progress, pending, or assigned status' });
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

			if (job.status === 'COMPLETED' || job.status === 'IN_PROGRESS' || job.status === 'ASSIGNED') {
				return res.status(400).json({ message: 'Cannot cancel completed, in-progress, or assigned job' });
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

	async approveJob(req: AuthRequest, res: Response) {
		try {
			const { jobId } = req.params;

			const job = await prisma.forkliftTask.findUnique({
				where: { id: jobId }
			});

			if (!job) {
				return res.status(404).json({ message: 'Forklift job not found' });
			}

			// Kiểm tra trạng thái hiện tại
			if (job.status !== 'PENDING_APPROVAL') {
				return res.status(400).json({ 
					message: 'Chỉ có thể duyệt công việc ở trạng thái CHỜ DUYỆT' 
				});
			}

			// Kiểm tra chi phí và báo cáo đã được nhập
			if (!job.cost || job.cost <= 0) {
				return res.status(400).json({ 
					message: 'Không thể duyệt: Chi phí chưa được nhập hoặc không hợp lệ' 
				});
			}

			if (!job.report_status) {
				return res.status(400).json({ 
					message: 'Không thể duyệt: Báo cáo chưa được gửi' 
				});
			}

			// Cập nhật trạng thái sang COMPLETED
			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: { 
					status: 'COMPLETED',
					updatedAt: new Date()
				}
			});

			// Ghi log audit
			await audit(req.user!._id, 'FORKLIFT_JOB_APPROVED', 'FORKLIFT_TASK', jobId, { 
				previous_status: job.status,
				new_status: 'COMPLETED',
				approved_at: new Date()
			});

			return res.json({
				success: true,
				message: 'Công việc đã được duyệt thành công',
				data: updatedJob
			});

		} catch (error) {
			console.error('Error approving job:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}

	async updateCost(req: AuthRequest, res: Response) {
		try {
			const { jobId } = req.params;
			const { cost } = req.body;

			// Validation: Chi phí phải là số nguyên không âm
			if (cost === undefined || cost === null) {
				return res.status(400).json({ message: 'Chi phí không được để trống' });
			}

			// Kiểm tra có phải là số không
			if (isNaN(cost) || typeof cost !== 'number') {
				return res.status(400).json({ message: 'Chi phí phải là số' });
			}

			// Kiểm tra có phải là số nguyên không
			if (!Number.isInteger(cost)) {
				return res.status(400).json({ message: 'Chi phí phải là số nguyên' });
			}

			// Kiểm tra có phải là số không âm không
			if (cost < 0) {
				return res.status(400).json({ message: 'Chi phí không thể là số âm' });
			}

			// Kiểm tra giới hạn chi phí (1 tỷ VNĐ)
			if (cost > 1000000000) {
				return res.status(400).json({ message: 'Chi phí quá cao. Vui lòng kiểm tra lại' });
			}

			const job = await prisma.forkliftTask.findUnique({
				where: { id: jobId }
			});

			if (!job) {
				return res.status(404).json({ message: 'Forklift job not found' });
			}

			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: { 
					cost: cost,
					updatedAt: new Date()
				}
			});

			await audit(req.user!._id, 'FORKLIFT_COST_UPDATED', 'FORKLIFT_TASK', jobId, { 
				previous_cost: job.cost,
				new_cost: cost 
			});

			return res.json({
				success: true,
				message: 'Chi phí đã được cập nhật thành công',
				data: updatedJob
			});

		} catch (error) {
			console.error('Error updating cost:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}

	async updateReport(req: AuthRequest, res: Response) {
		try {
			const { jobId } = req.params;
			const { report_status, report_image } = req.body;

			// Validate report_status
			const validStatuses = ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'];
			if (report_status && !validStatuses.includes(report_status)) {
				return res.status(400).json({ 
					message: `Invalid report status. Must be one of: ${validStatuses.join(', ')}` 
				});
			}

			const job = await prisma.forkliftTask.findUnique({
				where: { id: jobId }
			});

			if (!job) {
				return res.status(404).json({ message: 'Forklift job not found' });
			}

			const updatedJob = await prisma.forkliftTask.update({
				where: { id: jobId },
				data: { 
					report_status: report_status || undefined,
					report_image: report_image || undefined
				}
			});

			await audit(req.user!._id, 'FORKLIFT_REPORT_UPDATED', 'FORKLIFT_TASK', jobId, { 
				report_status,
				report_image,
				previous_status: job.report_status,
				previous_image: job.report_image
			});

			return res.json({
				success: true,
				message: 'Report updated successfully',
				data: updatedJob
			});

		} catch (error) {
			console.error('Error updating report:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}
}

export default new ForkliftController();


