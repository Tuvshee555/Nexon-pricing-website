import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const rows = await sql`
        SELECT id, email, name, password_hash, role
        FROM users WHERE email = ${credentials.email.toLowerCase()}
      `;
      const user = rows[0];
      if (!user || !user.password_hash) return null;

      const valid = await bcrypt.compare(credentials.password, user.password_hash as string);
      if (!valid) return null;

      return {
        id: user.id as string,
        email: user.email as string,
        name: (user.name as string) || "",
        role: (user.role as string) || "client",
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Email/password login
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "client";
      }

      // Google OAuth login
      if (account?.provider === "google" && profile?.email) {
        const rows = await sql`
          SELECT id, role FROM users WHERE email = ${profile.email.toLowerCase()}
        `;
        let dbUser = rows[0];

        if (!dbUser) {
          const [newUser] = await sql`
            INSERT INTO users (email, name, role)
            VALUES (${profile.email.toLowerCase()}, ${(profile as { name?: string }).name || ""}, 'client')
            RETURNING id, role
          `;
          dbUser = newUser;
        }

        token.id = dbUser.id as string;
        token.role = (dbUser.role as string) || "client";
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

export default NextAuth(authOptions);
