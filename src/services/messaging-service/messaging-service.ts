import type {
	OutboundImageMessage,
	OutboundVideoMessage,
	OutboundAudioMessage,
	OutboundDocumentMessage,
} from '@/domain/whatsapp/outbound-message-types'

/**
 * Tipo de mensagem outbound
 */
export enum MessageType {
	TEXT = 'text',
	INTERACTIVE = 'interactive', // Botões, listas do WhatsApp
	TEMPLATE = 'template', // Mensagens pré-aprovadas (fora janela 24h)
	MEDIA = 'media', // Imagens, documentos, etc.
}

/**
 * Destinatário da mensagem
 */
export interface MessageRecipient {
	phone: string
	name?: string // Opcional, para logs/analytics
}

/**
 * Mensagem de texto simples
 */
export interface TextMessage {
	type: MessageType.TEXT
	to: MessageRecipient
	text: string
	previewUrl?: boolean // Preview de links
}

/**
 * Mensagem interativa (botões)
 * WhatsApp suporta até 3 botões
 */
export interface InteractiveButtonMessage {
	type: MessageType.INTERACTIVE
	subType: 'button'
	to: MessageRecipient
	body: string
	footer?: string
	buttons: Array<{
		id: string
		title: string // Max 20 caracteres
	}>
}

/**
 * Mensagem interativa (lista)
 * WhatsApp suporta até 10 seções, 10 itens por seção
 */
export interface InteractiveListMessage {
	type: MessageType.INTERACTIVE
	subType: 'list'
	to: MessageRecipient
	body: string
	footer?: string
	buttonText: string // Texto do botão que abre a lista
	sections: Array<{
		title?: string
		rows: Array<{
			id: string
			title: string // Max 24 caracteres
			description?: string // Max 72 caracteres
		}>
	}>
}

/**
 * União de todos os tipos de mensagem
 */
export type OutboundMessage =
	| TextMessage
	| InteractiveButtonMessage
	| InteractiveListMessage
	| OutboundImageMessage
	| OutboundVideoMessage
	| OutboundAudioMessage
	| OutboundDocumentMessage

/**
 * Resultado de envio
 */
export interface SendMessageResult {
	success: boolean
	messageId?: string // ID retornado pela plataforma
	error?: string
	timestamp: Date
}

/**
 * Interface abstrata do serviço de mensageria
 * Estados e serviços dependem APENAS dessa interface
 */
export interface MessagingService {
	/**
	 * Envia uma mensagem
	 */
	send(message: OutboundMessage): Promise<SendMessageResult>

	/**
	 * Envia múltiplas mensagens em batch
	 * Útil para notificações em massa
	 */
	sendBatch(messages: OutboundMessage[]): Promise<SendMessageResult[]>
}
