/**
 * Types for outbound WhatsApp messages to be sent via the API
 */

/**
 * Image message to be sent
 */
export interface OutboundImageMessage {
	type: 'image'
	mediaId: string // WhatsApp media ID
	caption?: string // Optional caption text
	to: { phone: string }
}

/**
 * Video message to be sent
 */
export interface OutboundVideoMessage {
	type: 'video'
	mediaId: string
	caption?: string
	to: { phone: string }
}

/**
 * Audio message to be sent
 */
export interface OutboundAudioMessage {
	type: 'audio'
	mediaId: string
	to: { phone: string }
}

/**
 * Document message to be sent
 */
export interface OutboundDocumentMessage {
	type: 'document'
	mediaId: string
	caption?: string
	filename?: string
	to: { phone: string }
}

/**
 * Union type for all outbound media messages
 */
export type OutboundMediaMessage =
	| OutboundImageMessage
	| OutboundVideoMessage
	| OutboundAudioMessage
	| OutboundDocumentMessage

/**
 * Type guard to check if message is a media message
 */
export function isMediaMessage(
	message: unknown
): message is OutboundMediaMessage {
	const msg = message as any
	return (
		msg &&
		typeof msg === 'object' &&
		'mediaId' in msg &&
		['image', 'video', 'audio', 'document'].includes(msg.type)
	)
}
