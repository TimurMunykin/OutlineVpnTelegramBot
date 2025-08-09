const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const readline = require('readline')
const crypto = require('crypto')

const prisma = new PrismaClient()

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => rl.question(query, ans => {
    rl.close()
    resolve(ans)
  }))
}

async function main() {
  console.log('🔄 Seeding database...')
  console.log('')

  // Get admin credentials
  const adminEmail = await askQuestion('Admin email (default: admin@example.com): ')
  const finalAdminEmail = adminEmail.trim() || 'admin@example.com'
  
  const adminPassword = await askQuestion('Admin password (leave empty to generate random): ')
  let finalAdminPassword
  
  if (adminPassword.trim()) {
    finalAdminPassword = adminPassword.trim()
    console.log('✅ Using provided admin password')
  } else {
    finalAdminPassword = crypto.randomBytes(6).toString('hex')
    console.log('🔑 Generated admin password:', finalAdminPassword)
    console.log('⚠️  SAVE THIS PASSWORD!')
  }

  console.log('')

  // Get test user credentials
  const userEmail = await askQuestion('Test user email (default: user@example.com): ')
  const finalUserEmail = userEmail.trim() || 'user@example.com'
  
  const userPassword = await askQuestion('Test user password (leave empty to generate random): ')
  let finalUserPassword
  
  if (userPassword.trim()) {
    finalUserPassword = userPassword.trim()
    console.log('✅ Using provided test user password')
  } else {
    finalUserPassword = crypto.randomBytes(6).toString('hex')
    console.log('🔑 Generated test user password:', finalUserPassword)
    console.log('⚠️  SAVE THIS PASSWORD!')
  }

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