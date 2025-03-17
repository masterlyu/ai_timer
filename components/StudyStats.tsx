"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { getFocusRateDescription } from "@/lib/aiUtils";
import { useState } from "react";
import { Info } from "lucide-react";

interface StudyStatsProps {
  totalStudyTime: number; // 초 단위
  focusRate: number; // 0-100 사이의 값
}

export function StudyStats({ totalStudyTime, focusRate }: StudyStatsProps) {
  const [showFocusInfo, setShowFocusInfo] = useState(false);
  
  // 집중도에 따른 색상 결정
  const getFocusRateColor = () => {
    if (focusRate >= 80) return "bg-green-500";
    if (focusRate >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // 집중도 설명 가져오기
  const focusRateDescription = getFocusRateDescription(focusRate);
  
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground">오늘의 공부 시간</p>
            <p className="text-xl font-bold">{formatTime(totalStudyTime)}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground flex items-center">
              집중도
              <button 
                className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowFocusInfo(!showFocusInfo)}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </p>
            <div className="flex items-center">
              <p className={`text-xl font-bold ${
                focusRate >= 80 ? 'text-green-600' : 
                focusRate >= 60 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {focusRate}%
              </p>
              <div className="ml-2 w-16 h-2 bg-gray-200 rounded-full">
                <div 
                  className={`h-full ${getFocusRateColor()} rounded-full`}
                  style={{ width: `${focusRate}%` }}
                />
              </div>
            </div>
            
            {/* 집중도 설명 */}
            {showFocusInfo && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs text-gray-700 w-full">
                {focusRateDescription}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 