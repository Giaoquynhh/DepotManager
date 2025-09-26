const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Creating test user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'admin@smartlog.local' },
      update: {
        password_hash: hashedPassword,
        username: 'admin@smartlog.local'
      },
      create: {
        email: 'admin@smartlog.local',
        username: 'admin@smartlog.local',
        full_name: 'System Admin',
        role: 'SystemAdmin',
        status: 'ACTIVE',
        password_hash: hashedPassword
      }
    });
    
    console.log('✅ User created/updated:', {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

