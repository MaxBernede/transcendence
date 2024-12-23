import {
  integer,
  pgTable,
  varchar,
  primaryKey,
  timestamp,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  avatarUrl: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).unique(),
});

export const friends = pgTable(
	'friends',
	{
	  userId1: uuid()
		.notNull()
		.references(() => users.id),
	  userId2: uuid()
		.notNull()
		.references(() => users.id),
	},
	(table) => [
	  primaryKey({ columns: [table.userId1, table.userId2] }),
	]
  );

export const friendRequests = pgTable(
  'friend_requests',
  {
    senderId: uuid()
      .notNull()
      .references(() => users.id),
    receiverId: uuid()
      .notNull()
      .references(() => users.id),
    status: varchar({ length: 50 }).notNull().default('pending'), // e.g., 'pending', 'accepted', 'declined'
  },
  (table) => [primaryKey({ columns: [table.senderId, table.receiverId] })],
);

export const notifications = pgTable('notifications', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid()
    .notNull()
    .references(() => users.id),
  type: varchar({ length: 50 }).notNull(), // e.g., 'friend_request', 'message', etc.
  content: varchar({ length: 255 }).notNull(), // Notification content
  isRead: boolean().notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(), // Timestamp for notification
});
