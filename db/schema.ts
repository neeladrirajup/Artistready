import { sqliteTable, text, integer, real, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core';

// Every profile field is stored in a scalar column or a related row.
export const accounts = sqliteTable('profile_accounts', {
 id: text('id').primaryKey(), createdAt: text('created_at').notNull(),
});
export const profiles = sqliteTable('profiles', {
 id: text('id').primaryKey().references(()=>accounts.id),
 name: text('name').notNull(), role: text('role').notNull(), city: text('city').notNull(),
 version: integer('version').notNull().default(1),
 createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
},table=>[index('profiles_city_role').on(table.city,table.role)]);
export const media = sqliteTable('profile_media', {
 key: text('key').primaryKey(), ownerId: text('owner_id').notNull().references(()=>accounts.id),
 id: text('id').notNull(), kind: text('kind').notNull(), storageKey: text('storage_key').notNull(),
 name: text('name').notNull(), mime: text('mime').notNull(), size: integer('size').notNull(),
 createdAt: text('created_at').notNull(),
}, table=>[uniqueIndex('profile_media_owner_id').on(table.ownerId,table.id)]);

// Private preference answers are separate from the visibility setting.
export const artistPreferences = sqliteTable('artist_preferences', {
 artistId: text('artist_id').primaryKey().references(()=>profiles.id,{onDelete:'cascade'}),
 visibility: text('visibility').notNull().default('only_me'),adultConfirmed: integer('adult_confirmed',{mode:'boolean'}).notNull().default(false),
 version: integer('version').notNull().default(1),
 createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
});
export const artistPreferenceAnswers=sqliteTable('artist_preference_answers',{
 artistId:text('artist_id').notNull().references(()=>artistPreferences.artistId,{onDelete:'cascade'}),
 code:text('code').notNull(),choice:text('choice').notNull(),notes:text('notes').notNull(),
},table=>[primaryKey({columns:[table.artistId,table.code]})]);

// Provisioned by administrators only. No browser-facing role assignment endpoint.
export const verifiedManagers = sqliteTable('verified_managers', {
 accountId: text('account_id').primaryKey(),
 verifiedAt: text('verified_at').notNull(),
 isActive: integer('is_active',{mode:'boolean'}).notNull().default(true),
});

const owner=(name:string)=>text(name).notNull().references(()=>profiles.id,{onDelete:'cascade'});
const position=()=>integer('sort_order').notNull();
const valueTable=(name:string)=>sqliteTable(name,{artistId:owner('artist_id'),sortOrder:position(),value:text('value').notNull()},t=>[primaryKey({columns:[t.artistId,t.sortOrder]})]);
export const artistCastingRoles=valueTable('artist_casting_roles');
export const artistAdditionalRoles=valueTable('artist_additional_roles');
export const artistLanguages=valueTable('artist_languages');
export const artistSkills=valueTable('artist_skills');
export const artistPinnedMedia=valueTable('artist_pinned_media');
export const artistReelLinks=valueTable('artist_reel_links');
export const artistProfileDetails=sqliteTable('artist_profile_details',{
 artistId:owner('artist_id').primaryKey(),bodyBuild:text('body_build').notNull().default(''),bodyBuildDescription:text('body_build_description').notNull().default(''),
 bookingAvailableFrom:text('booking_available_from').notNull().default(''),bookingTravel:text('booking_travel').notNull().default(''),bookingLocations:text('booking_locations').notNull().default(''),bookingRepresentative:text('booking_representative').notNull().default(''),bookingEmail:text('booking_email').notNull().default(''),bookingPhone:text('booking_phone').notNull().default(''),bookingNotes:text('booking_notes').notNull().default(''),
 gender:text('gender').notNull().default(''),genderDescription:text('gender_description').notNull().default(''),maritalStatus:text('marital_status').notNull().default(''),workStatus:text('work_status').notNull().default(''),occupation:text('occupation').notNull().default(''),hairStyle:text('hair_style').notNull().default(''),hairColor:text('hair_color').notNull().default(''),ageFrom:text('age_from').notNull().default(''),ageTo:text('age_to').notNull().default(''),coverId:text('cover_id').notNull().default(''),bio:text('bio').notNull().default(''),experience:text('experience').notNull().default(''),photo:text('photo').notNull().default(''),reel:text('reel').notNull().default(''),showBookingContact:integer('show_booking_contact',{mode:'boolean'}).notNull().default(false),available:integer('available',{mode:'boolean'}).notNull().default(true),
},t=>[index('profile_details_gender_available').on(t.gender,t.available)]);
export const artistCallSheets=sqliteTable('artist_call_sheets',{
 artistId:owner('artist_id').primaryKey(),shootingStatus:text('shooting_status').notNull().default(''),project:text('project').notNull().default(''),shootFrom:text('shoot_from').notNull().default(''),shootTo:text('shoot_to').notNull().default(''),notes:text('notes').notNull().default(''),
});
export const artistCallSheetDates=sqliteTable('artist_call_sheet_dates',{
 artistId:owner('artist_id'),sortOrder:position(),id:text('id').notNull(),fromDate:text('from_date').notNull(),toDate:text('to_date').notNull(),status:text('status').notNull(),notes:text('notes').notNull(),
},t=>[primaryKey({columns:[t.artistId,t.id]})]);
export const artistClothingSizes=sqliteTable('artist_clothing_sizes',{artistId:owner('artist_id'),sortOrder:position(),sizeKey:text('size_key').notNull(),sizeValue:text('size_value').notNull()},t=>[primaryKey({columns:[t.artistId,t.sizeKey]})]);
export const artistSkillCategories=sqliteTable('artist_skill_categories',{artistId:owner('artist_id'),sortOrder:position(),skill:text('skill').notNull(),category:text('category').notNull()},t=>[primaryKey({columns:[t.artistId,t.skill]})]);
export const artistCredits=sqliteTable('artist_credits',{artistId:owner('artist_id'),sortOrder:position(),id:text('id').notNull(),title:text('title').notNull(),type:text('type').notNull(),role:text('role').notNull(),year:text('year').notNull(),director:text('director').notNull(),production:text('production').notNull(),trailer:text('trailer').notNull()},t=>[primaryKey({columns:[t.artistId,t.id]})]);
const milestone=(name:string)=>sqliteTable(name,{artistId:owner('artist_id'),sortOrder:position(),id:text('id').notNull(),title:text('title').notNull(),organisation:text('organisation').notNull(),year:text('year').notNull(),notes:text('notes').notNull()},t=>[primaryKey({columns:[t.artistId,t.id]})]);
export const artistTraining=milestone('artist_training');
export const artistRecognition=milestone('artist_recognition');
export const artistEducation=sqliteTable('artist_education',{artistId:owner('artist_id'),sortOrder:position(),id:text('id').notNull(),qualification:text('qualification').notNull(),institution:text('institution').notNull(),year:text('year').notNull(),notes:text('notes').notNull()},t=>[primaryKey({columns:[t.artistId,t.id]})]);

export const artistMeasurements = sqliteTable('artist_measurements', {
 artistId: text('artist_id').primaryKey().references(()=>profiles.id,{onDelete:'cascade'}),
 measurementFit: text('measurement_fit').notNull(), bodyBuild: text('body_build').notNull(),
 bodyBuildDescription:text('body_build_description').notNull().default(''),height:text('height').notNull().default(''),heightFeet:integer('height_feet'),heightInchPart:integer('height_inch_part'),
 heightInches: integer('height_inches'), weightKg: real('weight_kg'),
 chestIn: real('chest_in'), bustIn: real('bust_in'),
 waistIn: real('waist_in'), hipIn: real('hip_in'),
}, table=>[index('artist_measurements_build_fit').on(table.bodyBuild,table.measurementFit),index('artist_measurements_height').on(table.heightInches)]);
