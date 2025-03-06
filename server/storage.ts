import { users, type User, type InsertUser, gameHistory, type GameHistory, type InsertGameHistory, type NumericUser, type NumericGameHistory, gameSettings, type GameSettings, type InsertGameSettings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User Management
  getUser(id: number): Promise<NumericUser | undefined>;
  getUserByUsername(username: string): Promise<NumericUser | undefined>;
  createUser(user: InsertUser & { verificationToken?: string; emailVerified?: boolean; role?: string }): Promise<NumericUser>;
  updateUserBalance(id: number, balance: number): Promise<NumericUser>;
  updateUserStatus(id: number, status: string, banReason?: string): Promise<NumericUser>;
  listUsers(page: number, limit: number): Promise<{ users: NumericUser[], total: number }>;

  // Game History
  addGameHistory(history: InsertGameHistory): Promise<NumericGameHistory>;
  getUserHistory(userId: number): Promise<NumericGameHistory[]>;
  getGameStatistics(gameType?: string): Promise<any>;

  // Email Verification
  verifyEmail(token: string): Promise<NumericUser | undefined>;
  getUserByEmail(email: string): Promise<NumericUser | undefined>;
  updateUserVerificationToken(id: number, token: string): Promise<NumericUser>;

  // Password Reset
  updateUserResetToken(id: number, token: string, expiry: Date): Promise<NumericUser>;
  getUserByResetToken(token: string): Promise<NumericUser | undefined>;
  updateUserPassword(id: number, password: string): Promise<NumericUser>;

  // Game Settings
  getGameSettings(gameType: string): Promise<GameSettings | undefined>;
  updateGameSettings(settings: InsertGameSettings): Promise<GameSettings>;
  listGameSettings(): Promise<GameSettings[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<NumericUser | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? { ...user, balance: Number(user.balance) } : undefined;
  }

  async getUserByUsername(username: string): Promise<NumericUser | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user ? { ...user, balance: Number(user.balance) } : undefined;
  }

  async createUser(insertUser: InsertUser & { verificationToken?: string; emailVerified?: boolean; role?: string }): Promise<NumericUser> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return { ...user, balance: Number(user.balance) };
  }

  async updateUserBalance(id: number, balance: number): Promise<NumericUser> {
    const [user] = await db
      .update(users)
      .set({ balance: balance.toString() })
      .where(eq(users.id, id))
      .returning();
    return { ...user, balance: Number(user.balance) };
  }

  async updateUserStatus(id: number, status: string, banReason?: string): Promise<NumericUser> {
    const [user] = await db
      .update(users)
      .set({ status, banReason })
      .where(eq(users.id, id))
      .returning();
    return { ...user, balance: Number(user.balance) };
  }

  async listUsers(page: number, limit: number): Promise<{ users: NumericUser[], total: number }> {
    const offset = (page - 1) * limit;
    const users = await db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(users);

    return {
      users: users.map(user => ({ ...user, balance: Number(user.balance) })),
      total: Number(count)
    };
  }

  async addGameHistory(history: InsertGameHistory): Promise<NumericGameHistory> {
    const [entry] = await db.insert(gameHistory).values({
      ...history,
      betAmount: history.betAmount.toString(),
      multiplier: history.multiplier.toString(),
      payout: history.payout.toString(),
    }).returning();

    return {
      ...entry,
      betAmount: Number(entry.betAmount),
      multiplier: Number(entry.multiplier),
      payout: Number(entry.payout),
    };
  }

  async getUserHistory(userId: number): Promise<NumericGameHistory[]> {
    const entries = await db
      .select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, userId))
      .orderBy(gameHistory.timestamp);

    return entries.map(entry => ({
      ...entry,
      betAmount: Number(entry.betAmount),
      multiplier: Number(entry.multiplier),
      payout: Number(entry.payout),
    }));
  }

  async getGameStatistics(gameType?: string): Promise<any> {
    const query = db
      .select({
        totalBets: sql`count(*)`,
        totalBetAmount: sql`sum(bet_amount)`,
        totalPayout: sql`sum(payout)`,
        avgMultiplier: sql`avg(multiplier)`,
      })
      .from(gameHistory);

    if (gameType) {
      query.where(eq(gameHistory.gameType, gameType));
    }

    const [stats] = await query;
    return stats;
  }

  async verifyEmail(token: string): Promise<NumericUser | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          emailVerified: true, 
          verificationToken: null 
        })
        .where(eq(users.verificationToken, token))
        .returning();

      return user ? { ...user, balance: Number(user.balance) } : undefined;
    } catch (error) {
      console.error('Error verifying email:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<NumericUser | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ? { ...user, balance: Number(user.balance) } : undefined;
  }

  async updateUserVerificationToken(id: number, token: string): Promise<NumericUser> {
    const [user] = await db
      .update(users)
      .set({ verificationToken: token })
      .where(eq(users.id, id))
      .returning();
    return { ...user, balance: Number(user.balance) };
  }

  async updateUserResetToken(id: number, token: string, expiry: Date): Promise<NumericUser> {
    const [user] = await db
      .update(users)
      .set({ 
        resetToken: token,
        resetTokenExpiry: expiry.toISOString() 
      })
      .where(eq(users.id, id))
      .returning();
    return { ...user, balance: Number(user.balance) };
  }

  async getUserByResetToken(token: string): Promise<NumericUser | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user ? { ...user, balance: Number(user.balance) } : undefined;
  }

  async updateUserPassword(id: number, password: string): Promise<NumericUser> {
    const [user] = await db
      .update(users)
      .set({ 
        password,
        resetToken: null,
        resetTokenExpiry: null
      })
      .where(eq(users.id, id))
      .returning();
    return { ...user, balance: Number(user.balance) };
  }

  async getGameSettings(gameType: string): Promise<GameSettings | undefined> {
    const [settings] = await db
      .select()
      .from(gameSettings)
      .where(eq(gameSettings.gameType, gameType));
    return settings;
  }

  async updateGameSettings(settings: InsertGameSettings): Promise<GameSettings> {
    const [updated] = await db
      .insert(gameSettings)
      .values(settings)
      .onConflict(gameSettings.gameType)
      .merge()
      .returning();
    return updated;
  }

  async listGameSettings(): Promise<GameSettings[]> {
    return await db.select().from(gameSettings);
  }
}

export const storage = new DatabaseStorage();