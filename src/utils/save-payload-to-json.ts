import { promises as fs } from 'node:fs'
import path from 'node:path'

export async function savePayloadToJson(payload: any) {
	try {
		const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
		const logDir = path.join(process.cwd(), 'logs/whats-app-payloads', today)

		await fs.mkdir(logDir, { recursive: true })

		const messageId =
			payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id ||
			`unknown-${Date.now()}`
		const filename = `${messageId}.json`
		const filePath = path.join(logDir, filename)

		await fs.writeFile(filePath, JSON.stringify(payload, null, 2))
	} catch (error) {
		console.error('Failed to save raw webhook payload to file', { err: error })
	}
}
