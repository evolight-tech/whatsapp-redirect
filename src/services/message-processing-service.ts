import { FastifyBaseLogger } from 'fastify'
import { Dayjs, dayjs } from '@/config/date-and-time'
import { managersPhone } from '@/constants'
import { MessageReceivedEvent } from '@/events/message-received-event'
import { MessageType, MessagingService } from './messaging-service'

type Dependencies = {
	logger: FastifyBaseLogger
	messagingService: MessagingService
}

type MessageRegistry = { text: string; sentAt: Dayjs }

type ClientRegistery = {
	name: string
	phone: string
	messages: MessageRegistry[]
}

export class MessageProcessingService {
	private clientHistory: ClientRegistery[] = []

	constructor(private dependencies: Dependencies) {}

	async processMessage(event: MessageReceivedEvent) {
		const managersPhones = Object.entries(managersPhone)
		const selectedManager = managersPhones.find(
			([_, phone]) => phone === event.senderPhone
		)

		if (selectedManager) {
			await this.sendHistory(selectedManager[1])
		} else {
			await this.reportToManager(event)
		}
	}

	private async reportToManager(
		event: MessageReceivedEvent,
		managerPhone = managersPhone['Caio']
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
		let clientRecord: ClientRegistery
		const _clientRecord = this.clientHistory.find(
			client => client.phone === event.senderPhone
		)

		if (_clientRecord) {
			clientRecord = _clientRecord
			clientRecord.name = event.senderName ?? clientRecord.name

			clientRecord.messages.push(messageRegistry)
		} else {
			clientRecord = {
				name: event.senderName ?? 'Cliente sem nome',
				phone: event.senderPhone,
				messages: [messageRegistry],
			}

			this.clientHistory.push(clientRecord)
		}
	}

	private async sendHistory(managerPhone: string) {
		let historyMessage = '*Histórico de mensagens recebidas:*\n\n'
		const messagePartByClient = this.clientHistory
			.map(
				client =>
					`*${client.name}* - ${client.phone}\n${client.messages.map(message => `*${dayjs(message.sentAt).format('DD/MM/YYYY HH:mm')}*\n${message.text}`).join('\n')}`
			)
			.join('\n\n')

		historyMessage += messagePartByClient

		await this.dependencies.messagingService.send({
			type: MessageType.TEXT,
			text: historyMessage,
			to: { phone: managerPhone },
		})
	}
}
