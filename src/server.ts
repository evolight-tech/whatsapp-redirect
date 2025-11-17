import fastifyCors from '@fastify/cors'
import { FastifyListenOptions } from 'fastify'
import { env } from '@/config/env'
import { app } from './app'
import { router as whatsAppRouter } from './routes/whats-app/router'
import {
	MessagingService,
	WhatsAppMessagingService,
} from './services/messaging-service'

app.get('/health', async () => ({ status: 'ok' }))

let messagingService: MessagingService

async function bootstrap() {
	try {
		console.log('Server bootstrapping...')
		messagingService = new WhatsAppMessagingService()
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
	})

	const config: FastifyListenOptions = {
		port: env.PORT,
	}

	if (env.NODE_ENV === 'production') {
		config.host = '0.0.0.0'
	}

	try {
		const address = await app.listen({ ...config })
		console.log('Server started')
		console.log(address)
	} catch (error) {
		app.log.error(error)
		process.exit(1)
	}
}

void bootstrap()
