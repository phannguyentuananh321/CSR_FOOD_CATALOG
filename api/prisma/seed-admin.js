import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@amvi.local';
  const emailNormalized = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { emailNormalized },
  });

  const passwordHash = await argon2.hash('Admin@123456', {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        emailNormalized,
        displayName: 'Quản trị viên',
        passwordHash,
        role: 'admin',
        status: 'active',
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('Created default admin: admin@amvi.local / Admin@123456');
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'admin',
        status: 'active',
        passwordHash,
        updatedAt: new Date(),
      },
    });
    console.log('Updated existing user to admin: admin@amvi.local / Admin@123456');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
