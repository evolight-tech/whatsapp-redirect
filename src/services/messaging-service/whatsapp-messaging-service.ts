import {
	InteractiveButtonMessage,
	InteractiveListMessage,
	MessageType,
	MessagingService,
	OutboundMessage,
	SendMessageResult,
} from '@/services/messaging-service'
import type {
	OutboundImageMessage,
	OutboundVideoMessage,
	OutboundAudioMessage,
	OutboundDocumentMessage,
} from '@/domain/whatsapp/outbound-message-types'
import { env } from '@/config/env'
import { FastifyBaseLogger } from 'fastify'

/**
 * Payload da WhatsApp Cloud API
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */
interface WhatsAppApiPayload {
	messaging_product: 'whatsapp'
	recipient_type?: 'individual'
	to: string
	type: string
	text?: {
		body: string
		preview_url?: boolean
	}
	interactive?: {
		type: 'button' | 'list'
		body: { text: string }
		footer?: { text: string }
		action: unknown
	}
	image?: {
		id: string
		caption?: string
	}
	video?: {
		id: string
		caption?: string
	}
	audio?: {
		id: string
	}
	document?: {
		id: string
		caption?: string
		filename?: string
	}
}

export class WhatsAppMessagingService implements MessagingService {
	private readonly apiUrl: string
	private readonly accessToken: string
	private readonly phoneNumberId: string
	private readonly logger: FastifyBaseLogger

	constructor(opts: { logger: FastifyBaseLogger }) {
		this.phoneNumberId = env.PHONE_NUMBER_ID
		this.accessToken = env.WPP_TOKEN
		this.apiUrl = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`
		this.logger = opts.logger.child({
			service: 'WhatsAppMessagingService',
		})
	}

	async send(message: OutboundMessage): Promise<SendMessageResult> {
		const log = this.logger.child({ to: message.to.phone, type: message.type })
		try {
			const payload = this.buildPayload(message)

			const response = await fetch(this.apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.accessToken}`,
				},
				body: JSON.stringify(payload),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				log.error({ errorData, status: response.status }, 'WhatsApp API error')
				throw new Error(
					// Manter o throw para a lógica de retorno de erro
					`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`
				)
			}

			const data: any = await response.json()
			const messageId = data.messages?.[0]?.id

			log.info({ messageId }, 'Message sent successfully')
			return {
				success: true,
				messageId,
				timestamp: new Date(),
			}
		} catch (error) {
			log.error({ err: error }, 'Send failed')

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date(),
			}
		}
	}

	async sendBatch(messages: OutboundMessage[]): Promise<SendMessageResult[]> {
		// WhatsApp não tem endpoint de batch, envia sequencialmente
		// Adiciona delay para evitar rate limit (80 msgs/segundo)
		const results: SendMessageResult[] = []

		for (const message of messages) {
			const result = await this.send(message)
			results.push(result)

			// Delay de 50ms entre mensagens (20/segundo, seguro)
			if (messages.length > 1) {
				await this.delay(50)
			}
		}

		return results
	}

	/**
	 * Constrói payload da WhatsApp Cloud API a partir da mensagem abstrata
	 */
	private buildPayload(message: OutboundMessage): WhatsAppApiPayload {
		const messageType =
			'type' in message ? (message.type as string) : MessageType.TEXT

		const basePayload: WhatsAppApiPayload = {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: message.to.phone,
			type: messageType,
		}

		switch (message.type) {
			case MessageType.TEXT:
				return {
					...basePayload,
					text: {
						body: message.text,
						preview_url: message.previewUrl ?? false,
					},
				}

			case MessageType.INTERACTIVE:
				if (message.subType === 'button') {
					return this.buildButtonPayload(basePayload, message)
				}
				return this.buildListPayload(basePayload, message)

			case 'image':
				return this.buildImagePayload(
					basePayload,
					message as OutboundImageMessage
				)

			case 'video':
				return this.buildVideoPayload(
					basePayload,
					message as OutboundVideoMessage
				)

			case 'audio':
				return this.buildAudioPayload(
					basePayload,
					message as OutboundAudioMessage
				)

			case 'document':
				return this.buildDocumentPayload(
					basePayload,
					message as OutboundDocumentMessage
				)

			default:
				throw new Error(
					`Unsupported message type:\n${JSON.stringify(message, null, 2)}`
				)
		}
	}

	private buildButtonPayload(
		base: WhatsAppApiPayload,
		message: InteractiveButtonMessage
	): WhatsAppApiPayload {
		return {
			...base,
			interactive: {
				type: 'button',
				body: { text: message.body },
				footer: message.footer ? { text: message.footer } : undefined,
				action: {
					buttons: message.buttons.map(btn => ({
						type: 'reply',
						reply: {
							id: btn.id,
							title: btn.title,
						},
					})),
				},
			},
		}
	}

	private buildListPayload(
		base: WhatsAppApiPayload,
		message: InteractiveListMessage
	): WhatsAppApiPayload {
		return {
			...base,
			interactive: {
				type: 'list',
				body: { text: message.body },
				footer: message.footer ? { text: message.footer } : undefined,
				action: {
					button: message.buttonText,
					sections: message.sections.map(section => ({
						title: section.title,
						rows: section.rows,
					})),
				},
			},
		}
	}

	private buildImagePayload(
		base: WhatsAppApiPayload,
		message: OutboundImageMessage
	): WhatsAppApiPayload {
		return {
			...base,
			type: 'image',
			image: {
				id: message.mediaId,
				caption: message.caption,
			},
		}
	}

	private buildVideoPayload(
		base: WhatsAppApiPayload,
		message: OutboundVideoMessage
	): WhatsAppApiPayload {
		return {
			...base,
			type: 'video',
			video: {
				id: message.mediaId,
				caption: message.caption,
			},
		}
	}

	private buildAudioPayload(
		base: WhatsAppApiPayload,
		message: OutboundAudioMessage
	): WhatsAppApiPayload {
		return {
			...base,
			type: 'audio',
			audio: {
				id: message.mediaId,
			},
		}
	}

	private buildDocumentPayload(
		base: WhatsAppApiPayload,
		message: OutboundDocumentMessage
	): WhatsAppApiPayload {
		return {
			...base,
			type: 'document',
			document: {
				id: message.mediaId,
				caption: message.caption,
				filename: message.filename,
			},
		}
	}

	private getWhatsAppType(type: MessageType): string {
		switch (type) {
			case MessageType.TEXT:
				return 'text'
			case MessageType.INTERACTIVE:
				return 'interactive'
			case MessageType.TEMPLATE:
				return 'template'
			case MessageType.MEDIA:
				return 'image' // ou 'document', 'video', etc.
			default:
				return 'text'
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}
}
