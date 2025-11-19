import { FastifyBaseLogger } from 'fastify'
import { dayjs } from '@/config/date-and-time'
import { MessageReceivedEvent } from '@/events/message-received-event'
import { MessageType, MessagingService } from './messaging-service'
import { ClientService } from './client-service'
import { MessageService } from './message-service'
import { ManagerService } from './manager-service'

type Dependencies = {
	logger: FastifyBaseLogger
	messagingService: MessagingService
	clientService: ClientService
	messageService: MessageService
	managerService: ManagerService
}

export class MessageProcessingService {
	constructor(private dependencies: Dependencies) {}

	async processMessage(event: MessageReceivedEvent) {
		const managers = await this.dependencies.managerService.getAllManagers()
		const isManager = managers.some(
			manager => manager.phone === event.senderPhone
		)

		if (isManager) {
			await this.sendHistory(event.senderPhone)
		} else {
			await this.reportToManager(event)
		}
	}

	private async reportToManager(event: MessageReceivedEvent) {
		await this.dependencies.messagingService.send({
			type: MessageType.TEXT,
			text: '✅ Recebemos sua mensagem e em breve entraremos em contato com você.',
			to: { phone: event.senderPhone },
		})

		const managers = await this.dependencies.managerService.getAllManagers()

		await Promise.allSettled(
			managers.map(async manager => {
				return this.dependencies.messagingService.send({
					type: MessageType.TEXT,
					text: `*${event.senderName ?? 'Pessoa sem nome registrado'}* - ${event.senderPhone}\n*Enviou:*\n${event.text}`,
					to: { phone: manager.phone },
				})
			})
		)

		const client = await this.dependencies.clientService.getOrCreateClient(
			event.senderName ?? 'Cliente sem nome',
			event.senderPhone
		)

		await this.dependencies.messageService.createClientMessage(
			client.id,
			event.text
		)
	}

	private async sendHistory(managerPhone: string) {
		let historyMessage = '*Histórico de mensagens recebidas:*\n\n'

		const clients = await this.dependencies.clientService.getAllClients()

		const messagePartByClient = await Promise.all(
			clients.map(async client => {
				const messages =
					await this.dependencies.messageService.getClientMessages(client.id)
				return `*${client.name}* - ${client.phone}\n${messages
					.map(
						msg =>
							`*${dayjs(msg.createdAt).format('DD/MM/YYYY HH:mm')}*\n${msg.text}`
					)
					.join('\n\n')}`
			})
		)

		historyMessage +=
			messagePartByClient.length > 0
				? messagePartByClient.join('\n\n\n\n')
				: 'Nenhuma mensagem recebida ainda.'

		await this.dependencies.messagingService.send({
			type: MessageType.TEXT,
			text: historyMessage,
			to: { phone: managerPhone },
		})
	}
}
