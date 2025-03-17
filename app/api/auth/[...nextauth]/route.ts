import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import NaverProvider from "next-auth/providers/naver";
import KakaoProvider from "next-auth/providers/kakao";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

// 타입 확장
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth 설정
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    
    // 임시 테스트용 Credentials 로그인
    ...(process.env.ENABLE_CREDENTIALS === "true"
      ? [
          CredentialsProvider({
            id: "credentials",
            name: "테스트 계정",
            credentials: {
              username: { label: "이메일", type: "text", placeholder: "test@example.com" },
              password: { label: "비밀번호", type: "password" },
            },
            async authorize(credentials) {
              // 테스트용 계정 정보
              if (
                credentials?.username === "test@example.com" &&
                credentials?.password === "password"
              ) {
                return {
                  id: "1",
                  name: "테스트 사용자",
                  email: "test@example.com",
                  image: null,
                };
              }
              return null;
            },
          }),
        ]
      : []),
    
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID || "",
      clientSecret: process.env.NAVER_CLIENT_SECRET || "",
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/error",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // 사용자가 로그인할 때 토큰에 추가 정보를 저장
      if (account) {
        token.provider = account.provider;
        // 추가 정보 저장
        token.accessToken = account.access_token;
      } else if (user) {
        // Credentials 로그인의 경우 account가 없으므로 user에서 정보 가져옴
        token.provider = "credentials";
      }
      
      return token;
    },
    async session({ session, token }) {
      // 세션에 사용자 정보 추가
      if (token && token.provider) {
        session.user.provider = token.provider;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 항상 타이머 페이지로 리디렉션
      return `${baseUrl}/timer`;
    },
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 