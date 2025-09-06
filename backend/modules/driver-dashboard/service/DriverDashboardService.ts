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
				status: { in: ['PENDING', 'IN_PROGRESS', 'PENDING_APPROVAL'] }
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
				{ status: 'asc' }, // IN_PROGRESS trước, PENDING sau, PENDING_APPROVAL cuối
				{ createdAt: 'asc' }
			]
		});

		// Thêm container_info cho mỗi task
		const tasksWithContainerInfo = await Promise.all(
			tasks.map(async (task) => {
				try {
					const [containerInfo, actualLocation] = await Promise.all([
						prisma.serviceRequest.findFirst({
							where: { container_no: task.container_no },
							select: {
								driver_name: true,
								license_plate: true,
								status: true,
								type: true
							},
							orderBy: { createdAt: 'desc' }
						}),
						prisma.yardPlacement.findFirst({
							where: { 
								container_no: task.container_no, 
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
						})
					]);

					return {
						...task,
						container_info: containerInfo,
						actual_location: actualLocation
					};
				} catch (error) {
					console.log(`Could not find container info for ${task.container_no}:`, error);
					return {
						...task,
						container_info: null,
						actual_location: null
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

		// Kiểm tra validation khi hoàn thành task
		if (status === 'COMPLETED') {
			if (!task.report_status) {
				throw new Error('Không thể hoàn thành task: Báo cáo chưa được gửi');
			}
		}

		// Kiểm tra validation khi chuyển sang chờ duyệt
		if (status === 'PENDING_APPROVAL') {
			if (!task.report_status) {
				throw new Error('Không thể chuyển sang chờ duyệt: Báo cáo chưa được gửi');
			}
		}

		// Thực hiện transaction để cập nhật cả forklift task và service request
		const updatedTask = await prisma.$transaction(async (tx) => {
			// Cập nhật trạng thái forklift task
			const updatedForkliftTask = await tx.forkliftTask.update({
				where: { id: taskId },
				data: {
					status,
					...(notes && { notes }),
					updatedAt: new Date()
				}
			});

			// Nếu forklift task chuyển từ PENDING sang IN_PROGRESS, 
			// cập nhật ServiceRequest tương ứng
			if (task.status === 'PENDING' && status === 'IN_PROGRESS' && task.container_no) {
				const latestRequest = await tx.serviceRequest.findFirst({
					where: { container_no: task.container_no },
					orderBy: { createdAt: 'desc' }
				});

				if (latestRequest) {
					let newStatus: string;
					
					// Logic mới: Phân biệt giữa IMPORT và EXPORT
					if (latestRequest.type === 'EXPORT' && latestRequest.status === 'GATE_IN') {
						// Export request: GATE_IN → FORKLIFTING
						newStatus = 'FORKLIFTING';
					} else if (latestRequest.type === 'IMPORT' && latestRequest.status === 'POSITIONED') {
						// Import request: POSITIONED → FORKLIFTING (giữ nguyên logic cũ)
						newStatus = 'FORKLIFTING';
					} else {
						// Các trường hợp khác: không thay đổi
						return updatedForkliftTask;
					}

					// Cập nhật trạng thái ServiceRequest
					await tx.serviceRequest.update({
						where: { id: latestRequest.id },
						data: { 
							status: newStatus,
							updatedAt: new Date()
						}
					});

					// Ghi log audit cho việc thay đổi trạng thái ServiceRequest
					await tx.auditLog.create({
						data: {
							actor_id: driverId,
							action: 'REQUEST_STATUS_UPDATED',
							entity: 'ServiceRequest',
							entity_id: latestRequest.id,
							meta: {
								oldStatus: latestRequest.status,
								newStatus: newStatus,
								containerNo: task.container_no,
								requestType: latestRequest.type,
								taskId: taskId,
								timestamp: new Date()
							}
						}
					});
				}
			}

			return updatedForkliftTask;
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
					const [containerInfo, actualLocation] = await Promise.all([
						prisma.serviceRequest.findFirst({
							where: { container_no: task.container_no },
							select: {
								driver_name: true,
								license_plate: true,
								status: true,
								type: true
							},
							orderBy: { createdAt: 'desc' }
						}),
						prisma.yardPlacement.findFirst({
							where: { 
								container_no: task.container_no, 
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
						})
					]);

					return {
						...task,
						container_info: containerInfo,
						actual_location: actualLocation
					};
				} catch (error) {
					console.log(`Could not find container info for ${task.container_no}:`, error);
					return {
						...task,
						container_info: null,
						actual_location: null
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

		// Sử dụng tên file từ multer
		const fileName = file.filename;
		const relativePath = `/uploads/reports/${fileName}`; // Thêm dấu / ở đầu để tạo URL đúng

		// Multer đã lưu file, chỉ cần kiểm tra và cập nhật database
		const fs = require('fs');
		const path = require('path');
		
		console.log('=== UPLOAD DEBUG INFO ===');
		console.log('File info:', {
			originalname: file.originalname,
			mimetype: file.mimetype,
			size: file.size,
			hasBuffer: !!file.buffer,
			hasPath: !!file.path,
			filename: file.filename
		});
		
		// Kiểm tra file đã được multer lưu
		if (!file.path) {
			throw new Error('File was not saved by multer');
		}
		
		// Kiểm tra file tồn tại
		if (!fs.existsSync(file.path)) {
			throw new Error(`File not found at: ${file.path}`);
		}
		
		const stats = fs.statSync(file.path);
		console.log('File saved by multer. Size:', stats.size, 'bytes');

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

			console.log('=== UPLOAD COMPLETED SUCCESSFULLY ===');
			return updatedTask;
		} catch (error) {
			console.error('=== UPLOAD ERROR ===');
			console.error('Error in uploadReportImage service:', error);
			throw error;
		}
	}
}

export default new DriverDashboardService();
