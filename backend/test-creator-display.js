/**
 * Test script để kiểm tra hiển thị thông tin creator trong SealUsageHistory
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCreatorDisplay() {
    console.log('🔍 Test: Kiểm tra thông tin creator trong SealUsageHistory\n');

    try {
        // Lấy một seal để test
        const seal = await prisma.seal.findFirst({
            where: {
                status: 'ACTIVE'
            },
            include: {
                usageHistory: {
                    include: {
                        creator: {
                            select: {
                                full_name: true,
                                username: true,
                                email: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                }
            }
        });

        if (!seal) {
            console.log('❌ Không tìm thấy seal nào để test');
            return;
        }

        console.log(`📦 Seal ID: ${seal.id}`);
        console.log(`🏢 Shipping Company: ${seal.shipping_company}`);
        console.log(`📊 Số lượng lịch sử: ${seal.usageHistory.length}\n`);

        if (seal.usageHistory.length === 0) {
            console.log('❌ Seal này chưa có lịch sử sử dụng');
            return;
        }

        console.log('📋 Lịch sử sử dụng seal:');
        console.log('='.repeat(80));

        seal.usageHistory.forEach((history, index) => {
            console.log(`\n${index + 1}. Seal Number: ${history.seal_number}`);
            console.log(`   Container: ${history.container_number || 'N/A'}`);
            console.log(`   Booking: ${history.booking_number || 'N/A'}`);
            console.log(`   Export Date: ${history.export_date}`);
            console.log(`   Created At: ${history.created_at}`);
            
            if (history.creator) {
                console.log(`   👤 Creator Info:`);
                console.log(`      - Full Name: ${history.creator.full_name || 'N/A'}`);
                console.log(`      - Username: ${history.creator.username || 'N/A'}`);
                console.log(`      - Email: ${history.creator.email || 'N/A'}`);
            } else {
                console.log(`   👤 Creator: N/A (chỉ có created_by: ${history.created_by})`);
            }
        });

        // Test API endpoint
        console.log('\n🔗 Test API endpoint:');
        console.log(`GET /seals/${seal.id}/usage-history`);
        console.log('Expected response should include creator information');

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Chạy test
if (require.main === module) {
    testCreatorDisplay();
}

module.exports = { testCreatorDisplay };
