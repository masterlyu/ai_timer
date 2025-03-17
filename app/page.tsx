"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // 이미 로그인한 사용자는 타이머 페이지로 리디렉션
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/timer");
    }
  }, [status, router]);

  const handleStartClick = () => {
    setIsLoading(true);
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">AI 타이머</CardTitle>
          <CardDescription className="text-lg">
            AI 기반 학습 타이머 및 집중도 모니터링 앱
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center">
            AI 타이머는 학습 시간을 효율적으로 관리하고 집중도를 모니터링하여 최적의 학습 환경을 제공합니다.
          </p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <h3 className="font-semibold">맞춤형 추천</h3>
              <p className="text-sm text-muted-foreground">
                학습 패턴을 분석하여 최적의 공부 시간을 추천
              </p>
            </div>
            <div>
              <h3 className="font-semibold">집중도 모니터링</h3>
              <p className="text-sm text-muted-foreground">
                실시간 집중도 측정 및 피드백 제공
              </p>
            </div>
            <div>
              <h3 className="font-semibold">통계 분석</h3>
              <p className="text-sm text-muted-foreground">
                학습 데이터 시각화 및 인사이트 제공
              </p>
            </div>
            <div>
              <h3 className="font-semibold">다양한 기기 지원</h3>
              <p className="text-sm text-muted-foreground">
                모바일, 태블릿, 데스크톱에서 사용 가능
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            size="lg" 
            className="w-full"
            onClick={handleStartClick}
            disabled={isLoading}
          >
            {isLoading ? "이동 중..." : "시작하기"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
