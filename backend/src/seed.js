import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create fixed accounts
  const users = [
    {
      email: 'setup@diograce.com',
      password: 'setup123',
      name: 'Data Entry & Setup Operator',
      role: 'ROLE_A'
    },
    {
      email: 'site@diograce.com',
      password: 'site123',
      name: 'Site Execution Engineer',
      role: 'ROLE_B'
    },
    {
      email: 'viewer1@diograce.com',
      password: 'viewer123',
      name: 'Executive Management (Viewer 1)',
      role: 'ROLE_C'
    },
    {
      email: 'viewer2@diograce.com',
      password: 'viewer456',
      name: 'Client Auditor (Viewer 2)',
      role: 'ROLE_D'
    }
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const existing = await prisma.user.findUnique({
      where: { email: u.email }
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          email: u.email,
          passwordHash,
          name: u.name,
          role: u.role
        }
      });
      console.log(`Created account: ${u.email} (${u.role})`);
    } else {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          passwordHash,
          name: u.name,
          role: u.role
        }
      });
      console.log(`Updated account: ${u.email} (${u.role})`);
    }
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
