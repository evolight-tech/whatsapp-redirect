import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { env } from '@/config/env'
import { MessageProcessingService } from '@/services/message-processing-service'
import { MessageType, MessagingService } from '@/services/messaging-service'
import { savePayloadToJson } from '@/utils/save-payload-to-json'
import { WebhookParserService } from './parsers/webhook-parser'

type Resources = {
	messageProcessingService: MessageProcessingService
	messagingService: MessagingService
}

export async function receiveMessage(
	app: FastifyInstance,
	resources: Resources
) {
	const webhookParser = new WebhookParserService()

	// POST ingestion -> enqueue ProcessMensageCommand
	app.withTypeProvider<ZodTypeProvider>().post('/', {
		schema: {
			tags: ['Webhook'],
			summary: 'Receive WhatsApp message webhook',
		},
		handler: async (req, reply) => {
			// Save the raw webhook payload
			await savePayloadToJson(req.body)

			// Forwarding logic
			try {
				const entry0 = (req.body as any)?.entry?.[0]
				const change0 = entry0?.changes?.[0]
				const msg = change0?.value?.messages?.[0]
				const rawFrom = String(msg?.from ?? '')

				if (rawFrom) {
					const { LOCAL_FORWARD_URL, FORWARD_SECRET, TEST_NUMBERS } = env
					const testNumbers = TEST_NUMBERS.split(';')
						.map(s => s.trim())
						.filter(Boolean)

					const fwdHeader = req.headers['x-wpp-forwarded']
					const isAlreadyForwarded =
						typeof fwdHeader === 'string' && fwdHeader === FORWARD_SECRET
					const hasTarget = !!LOCAL_FORWARD_URL && !!FORWARD_SECRET

					if (
						hasTarget &&
						testNumbers.includes(rawFrom) &&
						!isAlreadyForwarded
					) {
						const res = await fetch(`${LOCAL_FORWARD_URL}/`, {
							method: 'POST',
							headers: {
								'content-type': 'application/json',
								'x-wpp-forwarded': String(FORWARD_SECRET),
							},
							body: JSON.stringify(req.body),
						})

						if (res.ok) {
							req.log.info(
								{ forwardedTo: LOCAL_FORWARD_URL },
								'Message forwarded successfully'
							)
							return reply.status(200).send({ status: 'ok', forwarded: true })
						} else {
							req.log.warn(
								{ status: res.status },
								'Forwarding failed, falling back to local processing'
							)
						}
					}
				}
			} catch (err) {
				req.log.error(
					{ err },
					'Error during message forwarding, falling back to local processing'
				)
			}

			const parseResult = webhookParser.parse(req.body)

			switch (parseResult.type) {
				case 'success': {
					const event = parseResult.event

					await resources.messageProcessingService.processMessage(event)

					req.log.info(
						{
							messageId: event.messageId,
							type: event.messageType,
							from: event.senderPhone,
							senderName: event.senderName,
						},
						'Message received'
					)
					break
				}

				case 'error': {
					req.log.error(
						{ reason: parseResult.reason, body: req.body },
						'Failed to parse message from webhook'
					)
					// Envia mensagem de fallback para o usuário, se possível
					if (parseResult.senderPhone) {
						await resources.messagingService.send({
							type: MessageType.TEXT,
							to: { phone: parseResult.senderPhone },
							text: 'Não foi possível processar sua mensagem. Por favor, tente novamente.',
						})
					}
					// Retorna 400 para indicar que o payload tinha um problema
					return reply.status(400).send({ error: parseResult.reason })
				}

				case 'unsupported': {
					req.log.info(
						{ reason: parseResult.reason },
						'Ignored webhook payload'
					)
					break
				}

				default: {
					req.log.error({ parseResult }, 'Unknown parse result type')
					break
				}
			}

			return reply.status(202).send()
		},
	})
}
