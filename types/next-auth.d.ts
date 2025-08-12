import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    display_name?: string;
    learning_language?: string;
    theme?: string;
  }

  interface Session {
    user: {
      username: string;
      display_name?: string;
      learning_language?: string;
      theme?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    display_name?: string;
    learning_language?: string;
    theme?: string;
  }
}
