"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function ErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-red-500">로그인 오류</CardTitle>
        <CardDescription>
          로그인 과정에서 오류가 발생했습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
            <p className="font-bold">오류 코드:</p>
            <p>{error}</p>
            
            {error === "OAuthCallback" && (
              <div className="mt-2">
                <p className="font-bold">가능한 원인:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>구글 OAuth 설정의 리디렉션 URI가 올바르지 않습니다.</li>
                  <li>환경 변수가 올바르게 설정되지 않았습니다.</li>
                </ul>
              </div>
            )}
            
            {error === "AccessDenied" && (
              <div className="mt-2">
                <p className="font-bold">가능한 원인:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>구글 계정 액세스가 거부되었습니다.</li>
                  <li>필요한 권한이 부여되지 않았습니다.</li>
                </ul>
              </div>
            )}
            
            {error === "Configuration" && (
              <div className="mt-2">
                <p className="font-bold">가능한 원인:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>NextAuth.js 설정에 문제가 있습니다.</li>
                  <li>환경 변수가 누락되었거나 잘못되었습니다.</li>
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            문제가 지속되면 다음 사항을 확인하세요:
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm text-gray-500">
            <li>구글 클라우드 콘솔에서 리디렉션 URI 설정</li>
            <li>환경 변수 설정</li>
            <li>브라우저 쿠키 및 캐시 삭제</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={() => window.location.href = "/login"}>
          로그인 페이지로 돌아가기
        </Button>
      </CardFooter>
    </Card>
  );
}

// 메인 페이지 컴포넌트
export default function ErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <p>로딩 중...</p>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
} 