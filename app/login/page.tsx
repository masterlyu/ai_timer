"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("test@example.com");
  const [password, setPassword] = useState<string>("password");

  // 이미 로그인한 사용자는 타이머 페이지로 리디렉션
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/timer");
    }
  }, [status, router]);

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 구글 로그인의 경우 callbackUrl을 명시적으로 지정하지 않음
      if (provider === "google") {
        await signIn(provider, { 
          redirect: true
        });
      } else {
        await signIn(provider, { 
          redirect: true,
          callbackUrl: "/timer"
        });
      }
      
      // redirect: true로 설정했기 때문에 이 코드는 실행되지 않음
    } catch (error) {
      console.error(`${provider} 로그인 중 오류 발생:`, error);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("로그인 시도:", { username, password });
      
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      
      console.log("로그인 결과:", result);
      
      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        console.error("Credentials 로그인 오류:", result.error);
      }
      // 리디렉션은 useEffect에서 처리
    } catch (error) {
      console.error("Credentials 로그인 중 오류 발생:", error);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중이거나 이미 인증된 경우 로딩 표시
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">AI 타이머에 로그인</CardTitle>
          <CardDescription>
            소셜 계정으로 로그인하여 학습 데이터를 저장하고 개인화된 추천을 받으세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          {/* 테스트 계정 로그인 폼 */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">이메일</Label>
              <Input
                id="username"
                type="email"
                placeholder="test@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "테스트 계정으로 로그인"}
            </Button>
          </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-500">또는 소셜 계정으로 로그인</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-12"
            onClick={() => handleSocialLogin("google")}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" fill="#4285F4" />
              </g>
            </svg>
            Google로 로그인
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-12 bg-green-50"
            onClick={() => handleSocialLogin("naver")}
            disabled={isLoading}
          >
            <div className="w-5 h-5 bg-green-500 text-white flex items-center justify-center text-xs font-bold">N</div>
            네이버로 로그인
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-12 bg-yellow-50"
            onClick={() => handleSocialLogin("kakao")}
            disabled={isLoading}
          >
            <div className="w-5 h-5 bg-yellow-400 text-black flex items-center justify-center text-xs font-bold">K</div>
            카카오로 로그인
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-xs text-center text-gray-500 mt-4">
            로그인하면 AI 타이머의 <a href="/terms" className="underline">이용약관</a>과 <a href="/privacy" className="underline">개인정보처리방침</a>에 동의하게 됩니다.
          </p>
          <p className="text-xs text-center text-gray-500 mt-2">
            테스트 계정: test@example.com / password
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 