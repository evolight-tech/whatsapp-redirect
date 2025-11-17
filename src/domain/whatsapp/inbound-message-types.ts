/**
 * Types for inbound WhatsApp messages received via webhook
 * All message types have a unified 'text' field that extracts the relevant text content
 */

/**
 * Base interface for all inbound WhatsApp messages
 */
interface InboundMessageBase {
	id: string
	from: string
	timestamp: string
	text: string // Unified text field (body, caption, button text, etc.)
}

/**
 * Text message
 */
export interface InboundTextMessage extends InboundMessageBase {
	type: 'text'
	// text comes from: message.text.body
}

/**
 * Image message
 */
export interface InboundImageMessage extends InboundMessageBase {
	type: 'image'
	// text comes from: message.image.caption || ''
	mediaId: string
	mimeType: string
	sha256: string
}

/**
 * Video message
 */
export interface InboundVideoMessage extends InboundMessageBase {
	type: 'video'
	// text comes from: message.video.caption || ''
	mediaId: string
	mimeType: string
	sha256: string
}

/**
 * Audio message
 */
export interface InboundAudioMessage extends InboundMessageBase {
	type: 'audio'
	// text is always empty for audio
	mediaId: string
	mimeType: string
	sha256: string
}

/**
 * Document message
 */
export interface InboundDocumentMessage extends InboundMessageBase {
	type: 'document'
	// text comes from: message.document.caption || ''
	mediaId: string
	mimeType: string
	sha256: string
	filename: string
}

/**
 * Button reply message
 */
export interface InboundButtonMessage extends InboundMessageBase {
	type: 'button'
	// text comes from: message.button.text
	interactiveId: string // button payload/id
}

/**
 * Interactive list reply message
 */
export interface InboundInteractiveMessage extends InboundMessageBase {
	type: 'interactive'
	// text comes from: message.interactive.list_reply.title
	interactiveId: string // list item id
	interactiveType: 'list_reply' | 'button_reply'
	description?: string // only for list_reply
}

/**
 * Union type for all inbound message types
 * Discriminated by the 'type' field
 */
export type InboundWhatsAppMessage =
	| InboundTextMessage
	| InboundImageMessage
	| InboundVideoMessage
	| InboundAudioMessage
	| InboundDocumentMessage
	| InboundButtonMessage
	| InboundInteractiveMessage

/**
 * Type guard to check if message has media
 */
export function hasMedia(
	message: InboundWhatsAppMessage
): message is
	| InboundImageMessage
	| InboundVideoMessage
	| InboundAudioMessage
	| InboundDocumentMessage {
	return (
		message.type === 'image' ||
		message.type === 'video' ||
		message.type === 'audio' ||
		message.type === 'document'
	)
}

/**
 * Type guard to check if message is interactive
 */
export function isInteractive(
	message: InboundWhatsAppMessage
): message is InboundButtonMessage | InboundInteractiveMessage {
	return message.type === 'button' || message.type === 'interactive'
}
