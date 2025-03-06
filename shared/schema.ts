import { pgTable, text, serial, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("1000"),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  banReason: text("ban_reason"),
  lastLoginAt: timestamp("last_login_at"),
});

export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameType: text("game_type").notNull(), // 'slots' | 'dice' | 'crash' | 'roulette' | 'blackjack'
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  multiplier: decimal("multiplier", { precision: 10, scale: 2 }).notNull(),
  payout: decimal("payout", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const gameSettings = pgTable("game_settings", {
  id: serial("id").primaryKey(),
  gameType: text("game_type").notNull().unique(),
  rtp: decimal("rtp", { precision: 5, scale: 2 }).notNull(),
  houseEdge: decimal("house_edge", { precision: 5, scale: 2 }).notNull(),
  minBet: decimal("min_bet", { precision: 10, scale: 2 }).notNull(),
  maxBet: decimal("max_bet", { precision: 10, scale: 2 }).notNull(),
  maxPayout: decimal("max_payout", { precision: 10, scale: 2 }).notNull(),
  settings: text("settings").notNull(), // JSON string for game-specific settings
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    password: true,
  })
  .extend({
    username: z.string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9]+$/, "Username must contain only letters and numbers, no spaces or special characters"),
    email: z.string()
      .email("Invalid email address")
      .refine(email => email.endsWith('@gmail.com'), {
        message: "Only Gmail addresses are allowed"
      }),
    password: z.string()
      .min(6, "Password must be at least 6 characters")
      .regex(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])[a-zA-Z0-9!@#$%^&*]+$/, 
        "Password must contain at least one uppercase letter, one number, and one special character (!@#$%^&*)")
  });

export const loginSchema = z.object({
  login: z.string(), // This will accept either username or email
  password: z.string()
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).omit({
  id: true,
  timestamp: true,
});

export const insertGameSettingsSchema = createInsertSchema(gameSettings).omit({
  id: true,
  updatedAt: true,
});

// Type to handle numeric operations in memory
export interface NumericGameHistory extends Omit<typeof gameHistory.$inferSelect, 'betAmount' | 'multiplier' | 'payout'> {
  betAmount: number;
  multiplier: number;
  payout: number;
}

// Type to handle numeric operations in memory
export interface NumericUser extends Omit<typeof users.$inferSelect, 'balance'> {
  balance: number;
}

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type GameHistory = typeof gameHistory.$inferSelect;
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;
export type GameSettings = typeof gameSettings.$inferSelect;
export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  BANNED: 'banned',
} as const;