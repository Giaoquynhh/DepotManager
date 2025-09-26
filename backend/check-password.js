const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkPassword() {
  try {
    console.log('🔍 Checking user password...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'admin@smartlog.local' },
      select: {
        id: true,
        email: true,
        username: true,
        password_hash: true,
        role: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      hasPassword: !!user.password_hash
    });
    
    // Test với các password khác nhau
    const passwords = ['admin123', 'admin@12344', 'admin', 'password'];
    
    for (const password of passwords) {
      try {
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log(`🔑 Password "${password}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        if (isValid) break;
      } catch (error) {
        console.log(`🔑 Password "${password}": ❌ Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();

