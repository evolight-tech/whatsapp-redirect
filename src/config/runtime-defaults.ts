export const runtimeConfigDefaults = {
	cors: {
		origins: ['http://localhost:5173'],
		credentials: true,
	},
	logging: {
		level: 'info',
		directory: './logs',
		maxFiles: 30,
		maxSize: '100m',
	},
	features: {
		testMode: false,
		maintenanceMode: false,
		aiEnabled: true,
	},
	rateLimit: {
		windowMs: 900_000,
		maxRequests: 100,
	},
	whatsapp: {
		webhookTimeout: 5_000,
		retryAttempts: 3,
	},
	media: {
		maxFileSizeMb: 10,
		allowedMimeTypes: [
			'image/jpeg',
			'image/png',
			'image/webp',
			'application/pdf',
			'audio/ogg',
			'audio/mpeg',
			'video/mp4',
			'video/3gpp',
		],
		downloadTimeoutMs: 30000,
	},
} as const

export type RuntimeConfigDefaults = typeof runtimeConfigDefaults
