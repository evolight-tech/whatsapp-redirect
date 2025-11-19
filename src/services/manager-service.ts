import { database } from '@/lib/drizzle'

export class ManagerService {
	async getManager(id: string) {
		const manager = await database.query.managers.findFirst({
			where: (managers, { eq }) => eq(managers.id, id),
		})

		return manager
	}

	async getAllManagers() {
		return database.query.managers.findMany()
	}
}
