import { messages } from '@/database/schemas'
import { database } from '@/lib/drizzle'

export class MessageService {
	async getClientMessages(clientId: string) {
		return database.query.messages.findMany({
			where: (messages, { eq }) => eq(messages.clientId, clientId),
			orderBy: (messages, { desc }) => [desc(messages.createdAt)],
		})
	}

	async createClientMessage(clientId: string, text: string) {
		await database.insert(messages).values({
			clientId,
			text,
		})
	}
}
