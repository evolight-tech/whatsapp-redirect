import type { InboundWhatsAppMessage } from '@/domain/whatsapp/inbound-message-types'

/**
 * Raw WhatsApp webhook message structure
 */
interface RawWhatsAppMessage {
	id: string
	from: string
	timestamp: string
	type: string
	text?: { body: string }
	image?: {
		id: string
		mime_type: string
		sha256: string
		caption?: string
	}
	video?: {
		id: string
		mime_type: string
		sha256: string
		caption?: string
	}
	audio?: {
		id: string
		mime_type: string
		sha256: string
	}
	document?: {
		id: string
		filename: string
		mime_type: string
		sha256: string
		caption?: string
	}
	button?: {
		payload: string
		text: string
	}
	interactive?: {
		type: 'list_reply' | 'button_reply'
		list_reply?: {
			id: string
			title: string
			description?: string
		}
		button_reply?: {
			id: string
			title: string
		}
	}
}

/**
 * Parses a raw WhatsApp webhook message into a typed InboundWhatsAppMessage
 * Extracts a unified 'text' field from different sources based on message type
 */
export function parseInboundMessage(
	raw: unknown
): InboundWhatsAppMessage | null {
	const message = raw as RawWhatsAppMessage

	// Validate required fields
	if (!message.id || !message.from || !message.timestamp || !message.type) {
		return null
	}

	const baseFields = {
		id: message.id,
		from: message.from,
		timestamp: message.timestamp,
	}

	switch (message.type) {
		case 'text':
			return {
				...baseFields,
				type: 'text',
				text: message.text?.body ?? '',
			}

		case 'image':
			if (!message.image?.id) return null
			return {
				...baseFields,
				type: 'image',
				text: message.image.caption ?? '',
				mediaId: message.image.id,
				mimeType: message.image.mime_type,
				sha256: message.image.sha256,
			}

		case 'video':
			if (!message.video?.id) return null
			return {
				...baseFields,
				type: 'video',
				text: message.video.caption ?? '',
				mediaId: message.video.id,
				mimeType: message.video.mime_type,
				sha256: message.video.sha256,
			}

		case 'audio':
			if (!message.audio?.id) return null
			return {
				...baseFields,
				type: 'audio',
				text: '', // Audio messages don't have text
				mediaId: message.audio.id,
				mimeType: message.audio.mime_type,
				sha256: message.audio.sha256,
			}

		case 'document':
			if (!message.document?.id) return null
			return {
				...baseFields,
				type: 'document',
				text: message.document.caption ?? '',
				mediaId: message.document.id,
				mimeType: message.document.mime_type,
				sha256: message.document.sha256,
				filename: message.document.filename,
			}

		case 'button':
			if (!message.button?.payload || !message.button?.text) return null
			return {
				...baseFields,
				type: 'button',
				text: message.button.text,
				interactiveId: message.button.payload,
			}

		case 'interactive':
			if (!message.interactive?.type) return null

			if (message.interactive.type === 'list_reply') {
				const listReply = message.interactive.list_reply
				if (!listReply?.id || !listReply?.title) return null
				return {
					...baseFields,
					type: 'interactive',
					text: listReply.title,
					interactiveId: listReply.id,
					interactiveType: 'list_reply',
					description: listReply.description,
				}
			} else if (message.interactive.type === 'button_reply') {
				const buttonReply = message.interactive.button_reply
				if (!buttonReply?.id || !buttonReply?.title) return null
				return {
					...baseFields,
					type: 'interactive',
					text: buttonReply.title,
					interactiveId: buttonReply.id,
					interactiveType: 'button_reply',
				}
			}
			return null

		default:
			// Unknown message type
			return null
	}
}

/**
 * Extracts message type from parsed message
 */
export function getMessageType(
	message: InboundWhatsAppMessage
):
	| 'text'
	| 'image'
	| 'video'
	| 'audio'
	| 'document'
	| 'button'
	| 'interactive' {
	return message.type
}
