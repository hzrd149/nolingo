import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { validatePassword } from "@/lib/password-validation";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the user session
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    }: ChangePasswordRequest = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          "Current password, new password, and confirmation are required",
      });
    }

    // Validate new password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirmation do not match",
      });
    }

    // Get user from database to verify current password
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
      })
      .from(users)
      .where(eq(users.username, session.user.username))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult[0];

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // Validate new password strength and requirements
    const validation = validatePassword(newPassword, currentPassword);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "New password does not meet requirements",
        errors: validation.errors,
        suggestions: validation.suggestions,
      });
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password in database
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        updated_at: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    // Log successful password change (without storing sensitive data)
    console.log(
      `Password changed successfully for user: ${user.username} at ${new Date().toISOString()}`,
    );

    return res.status(200).json({
      message: "Password changed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      message: "An error occurred while changing password. Please try again.",
    });
  }
}
