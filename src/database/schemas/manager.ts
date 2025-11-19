import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const managers = pgTable('managers', {
	id: uuid('id').defaultRandom().primaryKey(),
	phone: text('phone').notNull(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
})

export type Manager = typeof managers.$inferSelect
export type InsertManager = typeof managers.$inferInsert
