import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Seeding database...')

  // Create admin user
  const adminPassword = 'admin123'
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  })

  console.log('✅ Admin user created:', { id: admin.id, email: admin.email, role: admin.role })

  // Create a sample regular user
  const userPassword = 'user123'
  const hashedUserPassword = await bcrypt.hash(userPassword, 12)

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Test User',
      passwordHash: hashedUserPassword,
      role: 'USER',
      isEmailVerified: true,
    },
  })

  console.log('✅ Test user created:', { id: user.id, email: user.email, role: user.role })

  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('🔑 Login credentials:')
  console.log('   Admin: admin@example.com / admin123')
  console.log('   User:  user@example.com / user123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })