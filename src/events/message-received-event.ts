import { z } from 'zod'

export enum MessageProcessState {
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	COMPLETED = 'COMPLETED',
	ERROR = 'ERROR',
}

export type MessageType =
	| 'text'
	| 'image'
	| 'video'
	| 'audio'
	| 'document'
	| 'button'
	| 'interactive'

export interface MessageReceivedEvent {
	messageId: string
	messageType: MessageType
	text: string // Unified text field (body, caption, button text, etc.)
	timestamp: string
	senderName: string | undefined
	senderPhone: string
	receiverPhone: string
	state: MessageProcessState

	// Media fields (optional, present when messageType is image/video/audio/document)
	mediaId?: string
	mimeType?: string
	sha256?: string
	filename?: string // Only for documents

	// Interactive fields (optional, present when messageType is button/interactive)
	interactiveId?: string
	interactiveType?: 'list_reply' | 'button_reply'
}

export const MessageReceivedSchema = z.object({
	messageId: z.string(),
	messageType: z.enum([
		'text',
		'image',
		'video',
		'audio',
		'document',
		'button',
		'interactive',
	]),
	text: z.string().default(''),
	timestamp: z.string(),
	senderPhone: z.string().min(1),
	receiverPhone: z.string().min(1),
	state: z.enum([
		MessageProcessState.PENDING,
		MessageProcessState.PROCESSING,
		MessageProcessState.COMPLETED,
		MessageProcessState.ERROR,
	]),
	senderName: z.string().optional(),

	// Optional media fields
	mediaId: z.string().optional(),
	mimeType: z.string().optional(),
	sha256: z.string().optional(),
	filename: z.string().optional(),

	// Optional interactive fields
	interactiveId: z.string().optional(),
	interactiveType: z.enum(['list_reply', 'button_reply']).optional(),

	// Deprecated field
	content: z.string().optional(),
})
