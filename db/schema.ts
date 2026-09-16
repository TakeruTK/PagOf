import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const adminSessions = sqliteTable('admin_sessions', {
  tokenHash:text('token_hash').primaryKey(), expiresAt:integer('expires_at').notNull(), credentialVersion:text('credential_version').notNull(),
}, t=>[index('admin_sessions_expiry').on(t.expiresAt)]);
export const adminLoginAttempts = sqliteTable('admin_login_attempts', {
  key:text('key').primaryKey(), attempts:integer('attempts').notNull(), expiresAt:integer('expires_at').notNull(),
}, t=>[index('admin_login_attempts_expiry').on(t.expiresAt)]);
export const pieces = sqliteTable('pieces',{id:text('id').primaryKey(),name:text('name').notNull(),category:text('category').notNull(),kind:text('kind').notNull(),description:text('description').notNull(),material:text('material').notNull(),price:integer('price'),status:text('status').notNull(),availability:text('availability').notNull(),images:text('images').notNull(),updated:text('updated').notNull()},t=>[index('pieces_status_updated').on(t.status,t.updated)]);
