"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { recommendStudyDuration, SessionData, saveSessionData, FocusData } from "@/lib/aiUtils";
import { FocusMonitor } from "@/components/FocusMonitor";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SessionResult } from "@/components/SessionResult";
import { saveSessionToIndexedDB } from "@/lib/dbUtils";

interface TimerProps {
  initialTime?: number; // 초 단위
  onComplete?: () => void;
}

export function Timer({ initialTime = 25 * 60, onComplete }: TimerProps) {
  const [time, setTime] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [focusRate, setFocusRate] = useState(100);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [recommendedTime, setRecommendedTime] = useState(0);
  const [completedSession, setCompletedSession] = useState<SessionData | null>(null);
  const sessionStartTime = useRef<Date | null>(null);
  const totalSessionTime = useRef<number>(0);

  // 타이머 리셋
  const resetTimer = useCallback(() => {
    setTime(initialTime);
    setIsActive(false);
    setIsPaused(false);
    sessionStartTime.current = null;
    totalSessionTime.current = 0;
  }, [initialTime]);

  // 특정 시간으로 타이머 시작
  const startTimerWithDuration = useCallback((duration: number) => {
    setTime(duration);
    setIsActive(true);
    setIsPaused(false);
    sessionStartTime.current = new Date();
    setShowRecommendation(false);
  }, []);

  // 타이머 시작 전 AI 추천 시간 확인
  const checkRecommendedTime = useCallback(async () => {
    try {
      const recommended = await recommendStudyDuration();
      setRecommendedTime(recommended);
      
      // 추천 시간이 초기 시간과 5분 이상 차이나면 추천 다이얼로그 표시
      if (Math.abs(recommended - initialTime) >= 5 * 60) {
        setShowRecommendation(true);
      } else {
        startTimerWithDuration(initialTime);
      }
    } catch (error) {
      console.error('추천 시간을 가져오는 중 오류 발생:', error);
      // 오류 발생 시 기본 시간으로 시작
      startTimerWithDuration(initialTime);
    }
  }, [initialTime, startTimerWithDuration]);

  // 추천 시간 적용
  const applyRecommendedTime = useCallback(() => {
    startTimerWithDuration(recommendedTime);
  }, [recommendedTime, startTimerWithDuration]);

  // 기본 시간 사용
  const useDefaultTime = useCallback(() => {
    startTimerWithDuration(initialTime);
  }, [initialTime, startTimerWithDuration]);

  // 타이머 일시정지
  const pauseTimer = useCallback(() => {
    if (sessionStartTime.current) {
      // 세션 시작부터 현재까지의 시간을 누적
      totalSessionTime.current += (new Date().getTime() - sessionStartTime.current.getTime()) / 1000;
      sessionStartTime.current = null;
    }
    setIsPaused(true);
  }, []);

  // 타이머 재개
  const resumeTimer = useCallback(() => {
    sessionStartTime.current = new Date();
    setIsPaused(false);
  }, []);

  // 집중도 변경 처리
  const handleFocusRateChange = useCallback((rate: number) => {
    setFocusRate(rate);
  }, []);

  // 세션 결과 닫기
  const handleCloseSessionResult = useCallback(() => {
    setCompletedSession(null);
    onComplete?.();
  }, [onComplete]);

  // 새 세션 시작
  const handleStartNewSession = useCallback(() => {
    setCompletedSession(null);
    resetTimer();
    checkRecommendedTime().catch(error => {
      console.error('새 세션 시작 중 오류 발생:', error);
      startTimerWithDuration(initialTime);
    });
  }, [resetTimer, checkRecommendedTime, initialTime, startTimerWithDuration]);

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval!);
            setIsActive(false);
            
            // 세션 완료 시 총 세션 시간 계산
            if (sessionStartTime.current) {
              totalSessionTime.current += (new Date().getTime() - sessionStartTime.current.getTime()) / 1000;
              sessionStartTime.current = null;
            }
            
            // 세션 데이터 생성
            const sessionData: SessionData = {
              date: new Date().toISOString(),
              duration: totalSessionTime.current,
              focusRate: focusRate,
              timeOfDay: new Date().getHours(),
              completedSuccessfully: true
            };
            
            // 세션 데이터를 IndexedDB에 저장
            saveSessionToIndexedDB(sessionData);
            
            // 기존 LocalStorage에도 백업으로 저장
            saveSessionData(sessionData);
            
            // 세션 결과 표시
            setCompletedSession(sessionData);
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, focusRate]);

  // 타이머 UI
  return (
    <>
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            {/* 타이머 디스플레이 */}
            <div className="text-7xl font-bold tabular-nums">
              {formatTime(time)}
            </div>

            {/* 집중도 표시 */}
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${focusRate}%`,
                  backgroundColor: focusRate > 80 ? '#22c55e' : focusRate > 50 ? '#eab308' : '#ef4444'
                }}
              />
            </div>

            {/* 타이머 컨트롤 버튼 */}
            <div className="flex space-x-4">
              {!isActive ? (
                <Button 
                  size="lg" 
                  onClick={() => {
                    checkRecommendedTime().catch(error => {
                      console.error('추천 시간 확인 중 오류 발생:', error);
                      startTimerWithDuration(initialTime);
                    });
                  }}
                >
                  시작
                </Button>
              ) : isPaused ? (
                <Button size="lg" onClick={resumeTimer}>
                  재개
                </Button>
              ) : (
                <Button size="lg" onClick={pauseTimer}>
                  일시정지
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={resetTimer}>
                리셋
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 집중도 모니터링 */}
      <FocusMonitor isActive={isActive && !isPaused} onFocusRateChange={handleFocusRateChange} />

      {/* AI 추천 시간 다이얼로그 */}
      <Dialog open={showRecommendation} onOpenChange={setShowRecommendation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI 추천 공부 시간</DialogTitle>
            <DialogDescription>
              최근 세션 데이터를 분석한 결과, 현재 시간대에 가장 효과적인 공부 시간은 {formatTime(recommendedTime)}입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              이 시간대에 성공적으로 완료한 세션을 기반으로 계산되었습니다. 추천 시간을 사용하시겠습니까?
            </p>
          </div>
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button variant="outline" onClick={useDefaultTime}>
              기본 시간 사용 ({formatTime(initialTime)})
            </Button>
            <Button onClick={applyRecommendedTime}>
              추천 시간 적용 ({formatTime(recommendedTime)})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 세션 결과 */}
      {completedSession && (
        <SessionResult
          session={completedSession}
          onClose={handleCloseSessionResult}
          onStartNewSession={handleStartNewSession}
        />
      )}
    </>
  );
} 