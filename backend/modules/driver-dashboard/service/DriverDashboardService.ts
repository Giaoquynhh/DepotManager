import { prisma } from '../../../shared/config/database';

export class DriverDashboardService {
	async getDashboardData(driverId: string) {
		// Lấy thống kê tổng quan cho tài xế
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const [
			totalTasks,
			completedToday,
			pendingTasks,
			currentTask
		] = await Promise.all([
			// Tổng số task được giao
			prisma.forkliftTask.count({
				where: { assigned_driver_id: driverId }
			}),
			// Số task hoàn thành hôm nay
			prisma.forkliftTask.count({
				where: {
					assigned_driver_id: driverId,
					status: 'COMPLETED',
					updatedAt: { gte: today }
				}
			}),
			// Số task đang chờ
			prisma.forkliftTask.count({
				where: {
					assigned_driver_id: driverId,
					status: 'PENDING'
				}
			}),
			// Task hiện tại đang thực hiện
			prisma.forkliftTask.findFirst({
				where: {
					assigned_driver_id: driverId,
					status: 'IN_PROGRESS'
				},
				include: {
					from_slot: {
						include: {
							block: { include: { yard: true } }
						}
					},
					to_slot: {
						include: {
							block: { include: { yard: true } }
						}
					}
				}
			})
		]);

		return {
			summary: {
				totalTasks,
				completedToday,
				pendingTasks,
				completionRate: totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0
			},
			currentTask,
			lastUpdated: new Date()
		};
	}

	async getAssignedTasks(driverId: string) {
		const tasks = await prisma.forkliftTask.findMany({
			where: {
				assigned_driver_id: driverId,
				status: { in: ['PENDING', 'IN_PROGRESS'] }
			},
			include: {
				from_slot: {
					include: {
						block: { include: { yard: true } }
					}
				},
				to_slot: {
					include: {
						block: { include: { yard: true } }
					}
				}
			},
			orderBy: [
				{ status: 'asc' }, // IN_PROGRESS trước, PENDING sau
				{ createdAt: 'asc' }
			]
		});

		// Thêm container_info cho mỗi task
		const tasksWithContainerInfo = await Promise.all(
			tasks.map(async (task) => {
				try {
					const containerInfo = await prisma.serviceRequest.findFirst({
						where: { container_no: task.container_no },
						select: {
							driver_name: true,
							license_plate: true,
							status: true,
							type: true
						},
						orderBy: { createdAt: 'desc' }
					});

					return {
						...task,
						container_info: containerInfo
					};
				} catch (error) {
					console.log(`Could not find container info for ${task.container_no}:`, error);
					return {
						...task,
						container_info: null
					};
				}
			})
		);

		return tasksWithContainerInfo;
	}

	async updateTaskStatus(driverId: string, taskId: string, status: string, notes?: string) {
		// Kiểm tra task có thuộc về driver này không
		const task = await prisma.forkliftTask.findFirst({
			where: {
				id: taskId,
				assigned_driver_id: driverId
			}
		});

		if (!task) {
			throw new Error('Task not found or not assigned to this driver');
		}

		// Cập nhật trạng thái task
		const updatedTask = await prisma.forkliftTask.update({
			where: { id: taskId },
			data: {
				status,
				...(notes && { notes }),
				updatedAt: new Date()
			}
		});

		// Ghi log audit
		await prisma.auditLog.create({
			data: {
				actor_id: driverId,
				action: 'TASK_STATUS_UPDATED',
				entity: 'ForkliftTask',
				entity_id: taskId,
				meta: {
					oldStatus: task.status,
					newStatus: status,
					notes,
					timestamp: new Date()
				}
			}
		});

		return updatedTask;
	}

	async getTaskHistory(driverId: string) {
		const tasks = await prisma.forkliftTask.findMany({
			where: {
				assigned_driver_id: driverId,
				status: { in: ['COMPLETED', 'CANCELLED'] }
			},
			include: {
				from_slot: {
					include: {
						block: { include: { yard: true } }
					}
				},
				to_slot: {
					include: {
						block: { include: { yard: true } }
					}
				}
			},
			orderBy: { updatedAt: 'desc' },
			take: 20 // Chỉ lấy 20 task gần nhất
		});

		// Thêm container_info cho mỗi task
		const tasksWithContainerInfo = await Promise.all(
			tasks.map(async (task) => {
				try {
					const containerInfo = await prisma.serviceRequest.findFirst({
						where: { container_no: task.container_no },
						select: {
							driver_name: true,
							license_plate: true,
							status: true,
							type: true
						},
						orderBy: { createdAt: 'desc' }
					});

					return {
						...task,
						container_info: containerInfo
					};
				} catch (error) {
					console.log(`Could not find container info for ${task.container_no}:`, error);
					return {
						...task,
						container_info: null
					};
				}
			})
		);

		return tasksWithContainerInfo;
	}

	async updateTaskCost(driverId: string, taskId: string, cost: number) {
		// Kiểm tra task có thuộc về driver này không
		const task = await prisma.forkliftTask.findFirst({
			where: {
				id: taskId,
				assigned_driver_id: driverId
			}
		});

		if (!task) {
			throw new Error('Task not found or not assigned to this driver');
		}

		// Cập nhật chi phí task
		const updatedTask = await prisma.forkliftTask.update({
			where: { id: taskId },
			data: {
				cost,
				updatedAt: new Date()
			}
		});

		// Ghi log audit
		await prisma.auditLog.create({
			data: {
				actor_id: driverId,
				action: 'TASK_COST_UPDATED',
				entity: 'ForkliftTask',
				entity_id: taskId,
				meta: {
					oldCost: task.cost,
					newCost: cost,
					timestamp: new Date()
				}
			}
		});

		return updatedTask;
	}

	async uploadReportImage(driverId: string, taskId: string, file: Express.Multer.File) {
		try {
			// Kiểm tra task có thuộc về driver này không
			const task = await prisma.forkliftTask.findFirst({
				where: {
					id: taskId,
					assigned_driver_id: driverId
				}
			});

			if (!task) {
				throw new Error('Task not found or not assigned to this driver');
			}

			// Validate file
			if (!file) {
				throw new Error('Không có file được upload');
			}

			if (!file.originalname) {
				throw new Error('Tên file không hợp lệ');
			}

					// Tạo tên file duy nhất
		const fileName = `report_${taskId}_${Date.now()}_${file.originalname}`;
		const relativePath = `/uploads/reports/${fileName}`; // Thêm dấu / ở đầu để tạo URL đúng

			// Lưu file vào thư mục uploads
			const fs = require('fs');
			const path = require('path');
			
			// Tạo thư mục nếu chưa tồn tại
			const uploadDir = path.join(__dirname, '../../../uploads/reports');
			if (!fs.existsSync(uploadDir)) {
				fs.mkdirSync(uploadDir, { recursive: true });
			}
			
			// Lưu file - sử dụng stream thay vì buffer
			const absolutePath = path.join(uploadDir, fileName);
			
			console.log('File upload details:', {
				fileName,
				relativePath,
				absolutePath,
				uploadDir,
				hasBuffer: !!file.buffer,
				hasPath: !!file.path,
				fileSize: file.size
			});
			
			// Kiểm tra xem file có buffer hay stream
			if (file.buffer) {
				fs.writeFileSync(absolutePath, file.buffer);
				console.log('File saved using buffer');
			} else if (file.path) {
				// Nếu sử dụng diskStorage, file đã được lưu
				// Chỉ cần copy từ temp location
				const tempPath = file.path;
				if (fs.existsSync(tempPath)) {
					fs.copyFileSync(tempPath, absolutePath);
					console.log('File copied from temp path:', tempPath);
				} else {
					throw new Error(`Temp file not found: ${tempPath}`);
				}
					} else {
			throw new Error('Không thể lưu file: không có buffer hoặc path');
		}

		// Cập nhật task với thông tin báo cáo
		const updatedTask = await prisma.forkliftTask.update({
			where: { id: taskId },
			data: {
				report_status: 'SUBMITTED',
				report_image: relativePath,
				updatedAt: new Date()
			}
		});

		// Ghi log audit
		await prisma.auditLog.create({
			data: {
				actor_id: driverId,
				action: 'TASK_REPORT_UPLOADED',
				entity: 'ForkliftTask',
				entity_id: taskId,
				meta: {
					fileName,
					filePath: relativePath,
					timestamp: new Date()
				}
			}
		});

		return updatedTask;
		} catch (error) {
			console.error('Error in uploadReportImage service:', error);
			throw error;
		}
	}
}

export default new DriverDashboardService();
