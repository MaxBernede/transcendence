import { relations } from "drizzle-orm/relations";
import { user, matchHistory, conversation, chat, userConversation, userFriendsUser, userAchievements, achievement } from "./schema";

export const matchHistoryRelations = relations(matchHistory, ({one}) => ({
	user: one(user, {
		fields: [matchHistory.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	matchHistories: many(matchHistory),
	chats: many(chat),
	userConversations: many(userConversation),
	userFriendsUsers_userId1: many(userFriendsUser, {
		relationName: "userFriendsUser_userId1_user_id"
	}),
	userFriendsUsers_userId2: many(userFriendsUser, {
		relationName: "userFriendsUser_userId2_user_id"
	}),
	userAchievements: many(userAchievements),
}));

export const chatRelations = relations(chat, ({one}) => ({
	conversation: one(conversation, {
		fields: [chat.conversationId],
		references: [conversation.id]
	}),
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
}));

export const conversationRelations = relations(conversation, ({many}) => ({
	chats: many(chat),
	userConversations: many(userConversation),
}));

export const userConversationRelations = relations(userConversation, ({one}) => ({
	user: one(user, {
		fields: [userConversation.userId],
		references: [user.id]
	}),
	conversation: one(conversation, {
		fields: [userConversation.conversationId],
		references: [conversation.id]
	}),
}));

export const userFriendsUserRelations = relations(userFriendsUser, ({one}) => ({
	user_userId1: one(user, {
		fields: [userFriendsUser.userId1],
		references: [user.id],
		relationName: "userFriendsUser_userId1_user_id"
	}),
	user_userId2: one(user, {
		fields: [userFriendsUser.userId2],
		references: [user.id],
		relationName: "userFriendsUser_userId2_user_id"
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(user, {
		fields: [userAchievements.userId],
		references: [user.id]
	}),
	achievement: one(achievement, {
		fields: [userAchievements.achievementId],
		references: [achievement.id]
	}),
}));

export const achievementRelations = relations(achievement, ({many}) => ({
	userAchievements: many(userAchievements),
}));