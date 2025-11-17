import { FastifyBaseLogger } from 'fastify'
import { Dayjs, dayjs } from '@/config/date-and-time'
import { managersPhone } from '@/constants'
import { MessageReceivedEvent } from '@/events/message-received-event'
import { MessageType, MessagingService } from './messaging-service'
import { env } from '@/config/env'

type Dependencies = {
	logger: FastifyBaseLogger
	messagingService: MessagingService
}

type MessageRegistry = { text: string; sentAt: Dayjs }

type ClientRegistry = {
	name: string
	phone: string
	messages: MessageRegistry[]
}

export class MessageProcessingService {
	private static readonly MAX_CLIENTS = 1000
	private static readonly MAX_MESSAGES_PER_CLIENT = 100

	private clientHistory: ClientRegistry[] = []

	constructor(private dependencies: Dependencies) {}

	async processMessage(event: MessageReceivedEvent) {
		const managersPhones = Object.entries(managersPhone)
		const selectedManager = managersPhones.find(
			([_, phone]) => phone === event.senderPhone
		)

		if (selectedManager) {
			await this.sendHistory(selectedManager[1])
		} else {
			await this.reportToManager(
				event,
				env.NODE_ENV.includes('prod')
					? managersPhone['Paula']
					: managersPhone['Caio']
			)
		}
	}

	private async reportToManager(
		event: MessageReceivedEvent,
		// managerPhone = managersPhone['Caio']
		managerPhone: (typeof managersPhone)[keyof typeof managersPhone]
	) {
		await this.dependencies.messagingService.send({
			type: MessageType.TEXT,
			text: '✅ Recebemos sua mensagem e em breve entraremos em contato com você.',
			to: { phone: event.senderPhone },
		})
		await this.dependencies.messagingService.send({
			type: MessageType.TEXT,
			text: `*${event.senderName ?? 'Pessoa sem nome registrado'}* - ${event.senderPhone}\n*Enviou:*\n${event.text}`,
			to: { phone: managerPhone },
		})

		const messageRegistry: MessageRegistry = {
			text: event.text,
			sentAt: dayjs.utc(),
		}

		const existingClient = this.clientHistory.find(
			client => client.phone === event.senderPhone
		)

		if (existingClient) {
			existingClient.name = event.senderName ?? existingClient.name
			this.addMessageToClient(existingClient, messageRegistry)
		} else {
			const newClient: ClientRegistry = {
				name: event.senderName ?? 'Cliente sem nome',
				phone: event.senderPhone,
				messages: [messageRegistry],
			}
			this.addClientToHistory(newClient)
		}
	}

	private addMessageToClient(
		client: ClientRegistry,
		message: MessageRegistry
	): void {
		client.messages.unshift(message)

		if (
			client.messages.length > MessageProcessingService.MAX_MESSAGES_PER_CLIENT
		) {
			client.messages.pop()
		}
	}

	private addClientToHistory(client: ClientRegistry): void {
		this.clientHistory.unshift(client)

		if (this.clientHistory.length > MessageProcessingService.MAX_CLIENTS) {
			this.clientHistory.pop()
		}
	}

	private async sendHistory(managerPhone: string) {
		let historyMessage = '*Histórico de mensagens recebidas:*\n\n'
		const messagePartByClient = this.clientHistory
			.map(
				client =>
					`*${client.name}* - ${client.phone}\n${client.messages
						.map(
							message =>
								`*${dayjs(message.sentAt).format('DD/MM/YYYY HH:mm')}*\n${message.text}`
						)
						.join('\n\n')}`
			)
			.join('\n\n\n\n')

		historyMessage += messagePartByClient

		await this.dependencies.messagingService.send({
			type: MessageType.TEXT,
			text: historyMessage,
			to: { phone: managerPhone },
		})
	}
}
