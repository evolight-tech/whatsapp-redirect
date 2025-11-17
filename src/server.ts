import fastifyCors from '@fastify/cors'
import { FastifyListenOptions } from 'fastify'
import { env } from '@/config/env'
import { app } from './app'
import { router as whatsAppRouter } from './routes/whats-app/router'
import {
	MessagingService,
	WhatsAppMessagingService,
} from './services/messaging-service'
import { MessageProcessingService } from './services/message-processing-service'

app.get('/health', async () => ({ status: 'ok' }))

let messagingService: MessagingService
let messageProcessingService: MessageProcessingService

async function bootstrap() {
	try {
		console.log('Server bootstrapping...')
		messagingService = new WhatsAppMessagingService({ logger: app.log })
		messageProcessingService = new MessageProcessingService({
			logger: app.log,
			messagingService,
		})
	} catch (error) {
		app.log.error({ err: error }, 'Failed to initialize dependencies')
		process.exit(1)
	}

	const corsOrigins = ['*']

	await app.register(fastifyCors, {
		origin: corsOrigins,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	})

	await app.register(whatsAppRouter, {
		messagingService,
		messageProcessingService,
	})

	const config: FastifyListenOptions = {
		port: env.PORT,
	}

	if (env.NODE_ENV === 'production') {
		config.host = '0.0.0.0'
	}

	try {
		console.log(
			'Server will use the following config (besides inner defaults):\n',
			config
		)
		const address = await app.listen({ ...config })
		console.log('Server started successfully!')
		console.log('Address:', address)
	} catch (error) {
		console.error('ERROR in listen:', error)
		app.log.error(error)
		process.exit(1)
	}
}

void bootstrap()
