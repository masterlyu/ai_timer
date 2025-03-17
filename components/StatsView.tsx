"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { DetailedStatsView } from "@/components/DetailedStatsView";

interface StatsViewProps {
  weeklyStudyTime: number; // 초 단위
  weeklyFocusRate: number; // 0-100 사이의 값
  bestStudyDay: string;
  bestStudyTime: string;
}

export function StatsView({
  weeklyStudyTime,
  weeklyFocusRate,
  bestStudyDay,
  bestStudyTime,
}: StatsViewProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">주간 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">총 공부 시간</p>
              <p className="text-xl font-bold">{formatTime(weeklyStudyTime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">평균 집중도</p>
              <div className="flex items-center">
                <p className="text-xl font-bold">{weeklyFocusRate}%</p>
                <div className="ml-2 w-16 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${weeklyFocusRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">최적 공부 패턴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">최고 집중 요일</p>
              <p className="text-xl font-bold">{bestStudyDay}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">최고 집중 시간대</p>
              <p className="text-xl font-bold">{bestStudyTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상세 통계 및 피드백 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">상세 통계 및 피드백</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailedStatsView />
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground mt-4">
        <p>더 많은 세션을 완료할수록 더 정확한 통계가 제공됩니다.</p>
      </div>
    </div>
  );
} 