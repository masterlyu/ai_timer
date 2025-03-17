import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth 핸들러 생성 및 GET/POST 메서드 내보내기
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 