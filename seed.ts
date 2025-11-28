import { managers } from '@/database/schemas'
import { database } from '@/lib/drizzle'

const defaultManagers = [
	{ name: 'Paula', phone: '556283132731' },
	{ name: 'Caio', phone: '556292476996' },
	{ name: 'Weldner', phone: '556284093956' },
]

async function run() {
	await Promise.all(
		defaultManagers.map(async manager => {
			const existingManager = await database.query.managers.findFirst({
				where: (managersTable, { eq }) =>
					eq(managersTable.phone, manager.phone),
			})

			if (!existingManager) {
				await database.insert(managers).values({
					name: manager.name,
					phone: manager.phone,
				})
			}
		})
	)
}

run()
	.then(() => {
		console.log('[seed] Seed concluído com sucesso!')
		process.exit(0)
	})
	.catch(err => {
		console.error('[seed] Erro durante seed:', err)
		process.exit(1)
	})
