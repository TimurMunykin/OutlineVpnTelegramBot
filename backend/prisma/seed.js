const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Seeding database...')
  console.log('')

  // Check required environment variables
  const requiredEnvVars = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'USER_EMAIL', 'USER_PASSWORD']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.error('')
    console.error('💡 Please set these variables in your .env file:')
    console.error('   ADMIN_EMAIL=admin@yourdomain.com')
    console.error('   ADMIN_PASSWORD=your_secure_password')
    console.error('   USER_EMAIL=user@yourdomain.com')
    console.error('   USER_PASSWORD=user_secure_password')
    console.error('')
    process.exit(1)
  }

  // Get credentials from environment
  const finalAdminEmail = process.env.ADMIN_EMAIL
  const finalUserEmail = process.env.USER_EMAIL
  const finalAdminPassword = process.env.ADMIN_PASSWORD
  const finalUserPassword = process.env.USER_PASSWORD

  console.log('📋 Using credentials:')
  console.log(`   Admin: ${finalAdminEmail}`)
  console.log(`   User: ${finalUserEmail}`)

  console.log('')
  console.log('Creating users...')

  const hashedAdminPassword = await bcrypt.hash(finalAdminPassword, 12)
  const hashedUserPassword = await bcrypt.hash(finalUserPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: finalAdminEmail },
    update: {},
    create: {
      email: finalAdminEmail,
      name: 'Admin',
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  })

  console.log('✅ Admin user created:', { id: admin.id, email: admin.email, role: admin.role })

  const user = await prisma.user.upsert({
    where: { email: finalUserEmail },
    update: {},
    create: {
      email: finalUserEmail,
      name: 'Test User',
      passwordHash: hashedUserPassword,
      role: 'USER',
      isEmailVerified: true,
    },
  })

  console.log('✅ Test user created:', { id: user.id, email: user.email, role: user.role })

  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('🔑 Final login credentials:')
  console.log(`   Admin: ${finalAdminEmail} / ${finalAdminPassword}`)
  console.log(`   User:  ${finalUserEmail} / ${finalUserPassword}`)
  console.log('')
  console.log('⚠️  SAVE THESE CREDENTIALS - they will not be shown again!')
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