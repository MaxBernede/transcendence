import { eq, gt, gte, lt, lte, ne, relations, sql } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  text,
  unique,
  check,
  primaryKey,
  varchar,
  timestamp,
  date,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').unique(),
  password: text('password'),
  avatarUrl: text('avatar_url'),
});

export const friends = pgTable(
  'friends',
  {
    id: serial('id').primaryKey(), // Auto-incrementing primary key
    userId1: integer('user_id_1')
      .notNull()
      .references(() => users.id),
    userId2: integer('user_id_2')
      .notNull()
      .references(() => users.id),
  },
  (t) => {
    return [
      check('user_id1 === userid_2', ne(t.userId1, t.userId2)),
      check('user_id_1 < user_id_2', lt(t.userId1, t.userId2)),
      unique().on(t.userId1, t.userId2),
      {
        pk: primaryKey({ columns: [t.userId1, t.userId2] }),
      },
    ];
  },
);

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // 'private' or 'group'
  title: varchar('title', { length: 255 }).default(null), // Null for private chats
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersConversations = pgTable('users_conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  conversationId: integer('conversation_id').references(() => conversations.id),
  joinedAt: timestamp('joined_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull().references(() => conversations.id),
  senderId: integer('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
});
