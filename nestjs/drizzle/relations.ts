import { relations } from "drizzle-orm/relations";
import { user, matchHistory, userFriendsUser, userAchievements, achievement } from "./schema";

export const matchHistoryRelations = relations(matchHistory, ({one}) => ({
	user: one(user, {
		fields: [matchHistory.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	matchHistories: many(matchHistory),
	userFriendsUsers_userId1: many(userFriendsUser, {
		relationName: "userFriendsUser_userId1_user_id"
	}),
	userFriendsUsers_userId2: many(userFriendsUser, {
		relationName: "userFriendsUser_userId2_user_id"
	}),
	userAchievements: many(userAchievements),
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