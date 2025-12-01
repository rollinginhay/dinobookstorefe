import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Auth.js / NextAuth configuration
const authHandler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Lưu thêm thông tin khi user vừa đăng nhập lần đầu
      if (account && profile) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // Gắn thêm provider vào session nếu cần dùng phía client
      if (token && session.user) {
        (session.user as any).provider = (token as any).provider;
      }
      return session;
    },
  },
  // Tùy chọn, bạn có thể bật debug khi dev:
  // debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
});

export { authHandler as GET, authHandler as POST };



