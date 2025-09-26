import { prisma } from '../../../shared/config/database';
import path from 'path';

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

	async uploadTaskImages(driverId: string, taskId: string, files: Express.Multer.File[]) {
		// Kiểm tra quyền sở hữu task
		const task = await prisma.forkliftTask.findUnique({ where: { id: taskId } });
		if (!task) throw new Error('Task không tồn tại');
		if (task.assigned_driver_id !== driverId) throw new Error('Bạn không có quyền với task này');

		// Ghi nhận file vào bảng forkliftTaskReportImage nếu tồn tại, nếu không fallback lưu vào report_image
		const created: any[] = [];
		for (const f of files) {
			try {
				// Luôn chuẩn hóa đường dẫn lưu trữ thành URL tĩnh có thể truy cập qua Express static "/uploads"
				const fileName = path.basename(f.path);
				const storageUrl = `/uploads/reports/${fileName}`;
				if ((prisma as any).forkliftTaskReportImage) {
					// Map đúng schema: storage_url, file_name, file_type, file_size
					const rec = await (prisma as any).forkliftTaskReportImage.create({
						data: {
							task_id: taskId,
							storage_url: storageUrl,
							file_name: fileName,
							file_type: f.mimetype,
							file_size: f.size
						}
					});
					created.push(rec);
				} else {
					// Bảng ảnh chưa có: cập nhật trường report_image (giữ đường dẫn cuối cùng) dưới dạng URL tĩnh
					await prisma.forkliftTask.update({ where: { id: taskId }, data: { report_image: storageUrl } });
					created.push({ fallback: true, path: storageUrl });
				}
			} catch (e: any) {
				console.error('Save report image failed:', e);
			}
		}

		// Trả về tổng số ảnh hiện có
		let count = 0;
		try {
			count = await (prisma as any).forkliftTaskReportImage.count({ where: { task_id: taskId } });
		} catch {
			count = (await prisma.forkliftTask.findUnique({ where: { id: taskId } }))?.report_image ? 1 : 0;
		}

		return { uploaded: files.length, created, total_images: count };
	}

	async getTaskImages(driverId: string, taskId: string) {
		const task = await prisma.forkliftTask.findUnique({ where: { id: taskId } });
		if (!task) throw new Error('Task không tồn tại');
		if (task.assigned_driver_id !== driverId) throw new Error('Bạn không có quyền với task này');
		try {
			const rows = await (prisma as any).forkliftTaskReportImage.findMany({
				where: { task_id: taskId },
				orderBy: { createdAt: 'desc' }
			});
			// Chuẩn hóa storage_url nếu lỡ lưu absolute path trong dữ liệu cũ
				const normalized = rows.map((r: any) => {
				let storageUrl: string = r.storage_url?.replace(/\\/g, '/');
				// Nếu là absolute path Windows hoặc chứa '/DepotManager/backend/uploads/', chuyển thành URL tĩnh
				const idx = storageUrl?.lastIndexOf('/uploads/');
				if (idx >= 0) {
					storageUrl = storageUrl.substring(idx);
				} else if (/^[A-Za-z]:\//.test(storageUrl) || storageUrl.includes('/DepotManager/backend/uploads/')) {
					const fileName = path.basename(storageUrl);
						storageUrl = `/uploads/reports/${fileName}`;
				}
				return { ...r, storage_url: storageUrl };
			});
			return normalized;
		} catch {
				return task.report_image ? [{ id: 'legacy', task_id: taskId, storage_url: (task.report_image?.includes('/uploads/') ? task.report_image : `/uploads/reports/${path.basename(task.report_image)}`), file_name: path.basename(task.report_image), file_type: 'image/*', file_size: 0, createdAt: new Date() }] : [];
		}
	}

	async deleteTaskImage(driverId: string, taskId: string, imageId: string) {
		const task = await prisma.forkliftTask.findUnique({ where: { id: taskId } });
		if (!task) throw new Error('Task không tồn tại');
		if (task.assigned_driver_id !== driverId) throw new Error('Bạn không có quyền với task này');
		try {
			await (prisma as any).forkliftTaskReportImage.delete({ where: { id: imageId } });
		} catch {
			// legacy: nếu chỉ có report_image duy nhất
			if (task.report_image && imageId === 'legacy') {
				await prisma.forkliftTask.update({ where: { id: taskId }, data: { report_image: null as any } });
			}
		}
		let count = 0;
		try { count = await (prisma as any).forkliftTaskReportImage.count({ where: { task_id: taskId } }); } catch {}
		return { deleted: true, total_images: count };
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
					const [containerInfo, actualLocation, imagesCount] = await Promise.all([
						prisma.serviceRequest.findFirst({
							where: { container_no: task.container_no },
							select: {
								container_no: true,
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
						}),
						(async () => {
							try {
								return await (prisma as any).forkliftTaskReportImage.count({ where: { task_id: task.id } });
							} catch (e: any) {
								console.warn('Count report images fallback (table may be missing):', e?.message || e);
								return task.report_image ? 1 : 0;
							}
						})()
					]);

					return {
						...task,
						container_info: containerInfo,
						actual_location: actualLocation,
						report_images_count: imagesCount
					};
				} catch (error) {
					console.log(`Could not find container info for ${task.container_no}:`, error);
					return {
						...task,
						container_info: null,
						actual_location: null,
						report_images_count: 0
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

		// Bỏ ràng buộc yêu cầu báo cáo khi hoàn thành/chờ duyệt

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
                    } else if (latestRequest.type === 'IMPORT' && (latestRequest.status === 'POSITIONED' || latestRequest.status === 'CHECKED')) {
                        // Import request: Cho phép chuyển POSITIONED/CHECKED → FORKLIFTING
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

			// Nếu forklift task chuyển sang COMPLETED, cập nhật ServiceRequest và YardPlacement
			if (status === 'COMPLETED' && task.container_no) {
				const latestRequest = await tx.serviceRequest.findFirst({
					where: { container_no: task.container_no },
					orderBy: { createdAt: 'desc' }
				});

                if (latestRequest && latestRequest.status === 'FORKLIFTING') {
					// Logic mới: Phân biệt giữa IMPORT và EXPORT
					let newStatus: string;
                    if (latestRequest.type === 'EXPORT') {
                        // Cập nhật mới: khi xe nâng hoàn thành, chuyển sang DONE_LIFTING
                        newStatus = 'DONE_LIFTING';
						
						// Cập nhật YardPlacement để đánh dấu container đã rời khỏi bãi
						await tx.yardPlacement.updateMany({
							where: { 
								container_no: task.container_no,
								status: { in: ['OCCUPIED', 'HOLD'] }
							},
							data: { 
								status: 'REMOVED',
								removed_at: new Date(),
								updatedAt: new Date()
							}
						});
                    } else {
						// Import request: FORKLIFTING → IN_YARD (giữ nguyên logic cũ)
						newStatus = 'IN_YARD';
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
								container_no: true,
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

	// Các hàm ảnh báo cáo đã được gỡ bỏ

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

	// Hàm upload ảnh đã bỏ
}

export default new DriverDashboardService();
