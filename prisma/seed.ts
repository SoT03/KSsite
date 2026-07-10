// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	// Create demo users — update to your real emails/passwords before going live
	await prisma.user.upsert({
		where: { email: 'admin' },
		update: {},
		create: {
			email: 'admin',
			password: await bcrypt.hash('admin123', 10),
			name: 'Admin',
			role: 'admin',
		},
	});

	await prisma.user.upsert({
		where: { email: 'Misia' },
		update: {},
		create: {
			email: 'Misia',
			password: await bcrypt.hash('user123', 10),
			name: 'My Love',
			role: 'user',
		},
	});

	// Set anniversary date — CHANGE THIS to your actual anniversary!
	const existingAnniversary = await prisma.anniversaryDate.findFirst();
	if (!existingAnniversary) {
		await prisma.anniversaryDate.create({
			data: { date: new Date('2025-09-13') },
		});
	}

	// No sample "I love you for..." boxes are seeded — add real ones from the Admin panel.

	console.log('Seed completed!');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
