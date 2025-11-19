import { clients } from '@/database/schemas'
import { database } from '@/lib/drizzle'

export class ClientService {
	async getClient(id: string) {
		return database.query.clients.findFirst({
			where: (clients, { eq }) => eq(clients.id, id),
		})
	}

	async getAllClients() {
		return database.query.clients.findMany()
	}

	async getOrCreateClient(name: string, phone: string) {
		let client = await database.query.clients.findFirst({
			where: (clients, { eq, and }) =>
				and(eq(clients.name, name), eq(clients.phone, phone)),
		})

		if (!client) {
			const insertResult = await database
				.insert(clients)
				.values({
					name,
					phone,
				})
				.returning()

			client = insertResult[0]
		}

		return client
	}
}
