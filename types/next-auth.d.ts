import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    display_name?: string;
    learning_language?: string;
    theme?: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      display_name?: string;
      learning_language?: string;
      theme?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    username: string;
    display_name?: string;
    learning_language?: string;
    theme?: string;
  }
}
