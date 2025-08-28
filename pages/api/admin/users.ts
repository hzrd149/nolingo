import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { db } from "@/database";
import { users } from "@/database/schema";
import { eq, ne } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { generateSecurePassword } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Get the user session
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session?.user?.username) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if user is admin
  if (!session.user.is_admin) {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }

  switch (req.method) {
    case "GET":
      // Get all users (excluding the current admin user for security)
      try {
        const allUsers = await db
          .select({
            id: users.id,
            username: users.username,
            display_name: users.display_name,
            about: users.about,
            location: users.location,
            website: users.website,
            learning_language: users.learning_language,
            is_admin: users.is_admin,
            created_at: users.created_at,
            updated_at: users.updated_at,
          })
          .from(users)
          .where(ne(users.id, parseInt(session.user.id)));

        return res.status(200).json(allUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

    case "POST":
      // Create a new user
      try {
        const {
          username,
          display_name,
          about,
          location,
          website,
          learning_language,
          is_admin,
          password,
        } = req.body;

        // Validate required fields
        if (!username) {
          return res.status(400).json({ message: "Username is required" });
        }

        // Check if username already exists
        const existingUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (existingUser.length > 0) {
          return res.status(400).json({ message: "Username already exists" });
        }

        // Generate a secure password if not provided
        const userPassword = password || generateSecurePassword(12);
        const hashedPassword = await hashPassword(userPassword);

        // Create the user
        const newUser = await db.insert(users).values({
          username,
          password: hashedPassword,
          display_name: display_name || undefined,
          about: about || undefined,
          location: location || undefined,
          website: website || undefined,
          learning_language: learning_language || undefined,
          is_admin: is_admin ? 1 : 0,
        });

        return res.status(201).json({
          message: "User created successfully",
          username,
          password: password ? undefined : userPassword, // Only return generated password
        });
      } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

    case "DELETE":
      // Remove a user
      try {
        const { userId } = req.body;

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // Prevent admin from deleting themselves
        if (userId === parseInt(session.user.id)) {
          return res.status(400).json({ message: "Cannot delete yourself" });
        }

        // Check if user exists
        const userToDelete = await db
          .select({ id: users.id, is_admin: users.is_admin })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (userToDelete.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        // Prevent deletion of other admins (optional security measure)
        if (userToDelete[0].is_admin) {
          return res.status(403).json({ message: "Cannot delete admin users" });
        }

        // Delete the user
        await db.delete(users).where(eq(users.id, userId));

        return res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

    case "PUT":
      // Update user admin status or password
      try {
        const { userId, is_admin, password } = req.body;

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // Prevent admin from changing their own admin status
        if (userId === parseInt(session.user.id) && is_admin !== undefined) {
          return res
            .status(400)
            .json({ message: "Cannot change your own admin status" });
        }

        // Check if user exists
        const userToUpdate = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (userToUpdate.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        // Prepare update data
        const updateData: any = {};

        if (is_admin !== undefined) {
          updateData.is_admin = is_admin ? 1 : 0;
        }

        if (password) {
          const hashedPassword = await hashPassword(password);
          updateData.password = hashedPassword;
        }

        // Add updated_at timestamp
        updateData.updated_at = new Date().toISOString();

        // Update the user
        await db.update(users).set(updateData).where(eq(users.id, userId));

        return res.status(200).json({ message: "User updated successfully" });
      } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
      return res
        .status(405)
        .json({ message: `Method ${req.method} not allowed` });
  }
}
