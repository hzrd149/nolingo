import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Query the database for the user
          const user = await db
            .select({
              id: users.id,
              username: users.username,
              password: users.password,
              display_name: users.display_name,
              learning_language: users.learning_language,
              is_admin: users.is_admin,
            })
            .from(users)
            .where(eq(users.username, credentials.username))
            .limit(1);

          if (user.length === 0) {
            return null;
          }

          const foundUser = user[0];

          // Compare password using bcrypt
          const isPasswordValid = await verifyPassword(
            credentials.password,
            foundUser.password,
          );

          if (isPasswordValid) {
            return {
              id: foundUser.id.toString(),
              username: foundUser.username,
              display_name: foundUser.display_name || undefined,
              learning_language: foundUser.learning_language || undefined,
              is_admin: foundUser.is_admin || 0,
            };
          }

          return null;
        } catch (error) {
          console.error("Database authentication error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.display_name = user.display_name;
        token.learning_language = user.learning_language;
        token.userId = user.id;
        token.is_admin = user.is_admin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.username = token.username;
        session.user.display_name = token.display_name;
        session.user.learning_language = token.learning_language;
        session.user.id = token.userId;
        session.user.is_admin = token.is_admin;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
