import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Complete profile documents preserve every portfolio field, including future
// optional fields. Ownership and media references remain relational.
export const accounts = sqliteTable('profile_accounts', {
 id: text('id').primaryKey(), createdAt: text('created_at').notNull(),
});
export const profiles = sqliteTable('profiles', {
 id: text('id').primaryKey().references(()=>accounts.id),
 name: text('name').notNull(), role: text('role').notNull(), city: text('city').notNull(),
 document: text('document').notNull(), version: integer('version').notNull().default(1),
 createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
});
export const media = sqliteTable('profile_media', {
 key: text('key').primaryKey(), ownerId: text('owner_id').notNull().references(()=>accounts.id),
 id: text('id').notNull(), kind: text('kind').notNull(), storageKey: text('storage_key').notNull(),
 name: text('name').notNull(), mime: text('mime').notNull(), size: integer('size').notNull(),
 createdAt: text('created_at').notNull(),
}, table=>[uniqueIndex('profile_media_owner_id').on(table.ownerId,table.id)]);

// Private answers are deliberately separate from public profile documents.
export const artistPreferences = sqliteTable('artist_preferences', {
 artistId: text('artist_id').primaryKey().references(()=>profiles.id,{onDelete:'cascade'}),
 document: text('document').notNull(), version: integer('version').notNull().default(1),
 createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
});
