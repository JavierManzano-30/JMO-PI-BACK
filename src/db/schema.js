// Esquema de tablas para Drizzle ORM (alineado con sql/schema.sql).
import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const communities = pgTable('communities', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 60 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  communityId: integer('community_id').references(() => communities.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const themes = pgTable('themes', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').references(() => communities.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 150 }).notNull(),
  description: varchar('description', { length: 2000 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const photos = pgTable(
  'photos',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    themeId: integer('theme_id').notNull().references(() => themes.id, { onDelete: 'cascade' }),
    communityId: integer('community_id').references(() => communities.id, { onDelete: 'set null' }),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 150 }).notNull(),
    description: varchar('description', { length: 2000 }),
    imageUrl: text('image_url').notNull(),
    thumbUrl: text('thumb_url'),
    isModerated: boolean('is_moderated').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uqPhotosUserThemeActive: uniqueIndex('uq_photos_user_theme_active')
      .on(table.userId, table.themeId)
      .where(sql`${table.isDeleted} = false`),
  })
);

export const votes = pgTable(
  'votes',
  {
    id: serial('id').primaryKey(),
    photoId: integer('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uqVotesUserPhoto: unique('uq_votes_user_photo').on(table.userId, table.photoId),
  })
);

export const moderation = pgTable('moderation', {
  id: serial('id').primaryKey(),
  photoId: integer('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  moderatorId: integer('moderator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 50 }).notNull(),
  reason: varchar('reason', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const winners = pgTable('winners', {
  id: serial('id').primaryKey(),
  themeId: integer('theme_id').notNull().unique().references(() => themes.id, { onDelete: 'cascade' }),
  photoId: integer('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
