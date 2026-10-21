import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core';

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

// Provisioned by administrators only. No browser-facing role assignment endpoint.
export const verifiedManagers = sqliteTable('verified_managers', {
 accountId: text('account_id').primaryKey(),
 verifiedAt: text('verified_at').notNull(),
 isActive: integer('is_active',{mode:'boolean'}).notNull().default(true),
});

// Searchable projection of the public profile fields. SQL triggers in migration
// 0003 keep these rows synchronized with the complete profile document.
export const artistSearch = sqliteTable('artist_search', {
 artistId: text('artist_id').primaryKey().references(()=>profiles.id,{onDelete:'cascade'}),
 name: text('name').notNull(), role: text('role').notNull(), category: text('category').notNull(),
 city: text('city').notNull(), gender: text('gender').notNull(), available: integer('available').notNull(),
 ageFrom: integer('age_from'), ageTo: integer('age_to'), experienceYears: integer('experience_years').notNull(),
 searchText: text('search_text').notNull(),
}, table=>[index('artist_search_city_category').on(table.city,table.category),index('artist_search_available').on(table.available),index('artist_search_gender').on(table.gender),index('artist_search_age').on(table.ageFrom,table.ageTo)]);
export const artistSearchSkills = sqliteTable('artist_search_skills', {
 artistId: text('artist_id').notNull().references(()=>profiles.id,{onDelete:'cascade'}),
 value: text('value').notNull(),
}, table=>[primaryKey({columns:[table.artistId,table.value]}),index('artist_search_skills_value').on(table.value,table.artistId)]);
export const artistSearchLanguages = sqliteTable('artist_search_languages', {
 artistId: text('artist_id').notNull().references(()=>profiles.id,{onDelete:'cascade'}),
 value: text('value').notNull(),
}, table=>[primaryKey({columns:[table.artistId,table.value]}),index('artist_search_languages_value').on(table.value,table.artistId)]);
