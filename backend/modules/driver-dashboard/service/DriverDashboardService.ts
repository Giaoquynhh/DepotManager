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
		return prisma.forkliftTask.findMany({
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
		return prisma.forkliftTask.findMany({
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
	}
}

export default new DriverDashboardService();
