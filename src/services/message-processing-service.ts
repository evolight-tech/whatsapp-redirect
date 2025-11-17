import { FastifyBaseLogger } from 'fastify'
import { MessageReceivedEvent } from '@/events/message-received-event'
import { MessageType, MessagingService } from './messaging-service'
import { managersPhone } from '@/constants'

type Dependencies = {
	logger: FastifyBaseLogger
	messagingService: MessagingService
}
export class MessageProcessingService {
	constructor(private dependencies: Dependencies) {}

	async processMessage(event: MessageReceivedEvent) {
		try {
			await this.dependencies.messagingService.send({
				type: MessageType.TEXT,
				text: '✅ Recebemos sua mensagem e em breve entraremos em contato com você.',
				to: { phone: event.senderPhone },
			})
			await this.dependencies.messagingService.send({
				type: MessageType.TEXT,
				text: `*${event.senderName ?? 'Pessoa sem nome registrado'}* - ${event.senderPhone}\n*Enviou:*\n${event.text}`,
				to: { phone: managersPhone['Caio'] },
			})
		} catch (error) {
			console.error('ERROR in MessageProcessingService:\n', error)
			this.dependencies.logger.error(error)
		}
	}
}
