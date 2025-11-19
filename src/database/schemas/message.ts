import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { clients } from './client'

export const messages = pgTable('messages', {
	id: uuid('id').defaultRandom().primaryKey(),
	text: text('text').notNull(),
	clientId: uuid('client_id').references(() => clients.id, {
		onDelete: 'cascade',
	}),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
})

export type Message = typeof messages.$inferSelect
export type InsertMessage = typeof messages.$inferInsert
