import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = userData.id ? await this.getUser(userData.id) : null;
    const isNewUser = !existingUser;

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Send welcome email for new users
    if (isNewUser && user.email) {
      import("../../services/notification").then(({ notificationService }) => {
        notificationService.sendWelcomeEmail({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
        }).catch((err: any) => {
          console.error("Failed to send welcome email:", err);
        });
      }).catch((err: any) => {
        console.error("Failed to load notification service:", err);
      });
    }

    return user;
  }
}

export const authStorage = new AuthStorage();
