// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	// Create demo users — update to your real emails/passwords before going live
	await prisma.user.upsert({
		where: { email: 'admin' },
		update: {},
		create: {
			email: 'admin',
			password: 'admin123', // In production, hash this!
			name: 'Admin',
			role: 'admin',
		},
	});

	await prisma.user.upsert({
		where: { email: 'Misia' },
		update: {},
		create: {
			email: 'Misia',
			password: 'user123', // In production, hash this!
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

	// Create sample messages for the current year
	const year = new Date().getFullYear();
	for (let day = 1; day <= 10; day++) {
		await prisma.message.upsert({
			where: {
				year_dayNumber: { year, dayNumber: day },
			},
			update: {},
			create: {
				year,
				dayNumber: day,
				content: `your beautiful smile on day ${day}`,
			},
		});
	}

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
