"use client";

import { useState, useEffect, useRef } from "react";
import { FocusData, calculateFocusRate, predictFocusDecline } from "@/lib/aiUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Clock, Smartphone, Volume2 } from "lucide-react";
import { SoundPlayer } from "@/components/SoundPlayer";

interface FocusMonitorProps {
  isActive: boolean;
  onFocusRateChange: (rate: number) => void;
}

export function FocusMonitor({ isActive, onFocusRateChange }: FocusMonitorProps) {
  const [focusDataList, setFocusDataList] = useState<FocusData[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [currentFocusRate, setCurrentFocusRate] = useState(100);
  const [playAlertSound, setPlayAlertSound] = useState(false);
  const [focusDeclineReason, setFocusDeclineReason] = useState<string>("");
  const [focusDeclineType, setFocusDeclineType] = useState<"inactivity" | "distraction" | "fatigue" | "general">("general");
  
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVisibilityChangeRef = useRef<number>(Date.now());
  const lastTouchRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityCountRef = useRef<number>(0);
  const tabSwitchCountRef = useRef<number>(0);
  const lastFocusRateRef = useRef<number>(100);

  // 페이지 가시성 변경 감지
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      const timestamp = Date.now();
      const isFocused = document.visibilityState === "visible";
      
      // 가시성 변경 시간 기록
      lastVisibilityChangeRef.current = timestamp;
      
      // 탭 전환 횟수 증가 (페이지가 숨겨질 때)
      if (!isFocused) {
        tabSwitchCountRef.current += 1;
      }
      
      // 포커스 데이터 추가
      setFocusDataList(prev => [
        ...prev,
        {
          timestamp,
          isFocused,
          eventType: "visibility"
        }
      ]);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive]);

  // 터치 이벤트 감지
  useEffect(() => {
    if (!isActive) return;

    const handleTouch = () => {
      const timestamp = Date.now();
      
      // 마지막 터치 시간과 현재 시간의 차이가 10초 이상이면 집중하고 있다고 판단
      const isFocused = timestamp - lastTouchRef.current < 10000;
      
      // 터치 시간 기록
      lastTouchRef.current = timestamp;
      
      // 포커스 데이터 추가
      setFocusDataList(prev => [
        ...prev,
        {
          timestamp,
          isFocused,
          eventType: "touch"
        }
      ]);
    };

    document.addEventListener("touchstart", handleTouch);
    document.addEventListener("click", handleTouch);
    
    return () => {
      document.removeEventListener("touchstart", handleTouch);
      document.removeEventListener("click", handleTouch);
    };
  }, [isActive]);

  // 주기적인 집중도 체크 (30초마다)
  useEffect(() => {
    if (!isActive) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    const checkFocus = () => {
      const timestamp = Date.now();
      
      // 마지막 가시성 변경 또는 터치 이벤트로부터 30초 이상 지났는지 확인
      const timeSinceLastVisibilityChange = timestamp - lastVisibilityChangeRef.current;
      const timeSinceLastTouch = timestamp - lastTouchRef.current;
      
      // 30초 이상 상호작용이 없으면 집중하지 않는 것으로 판단
      const isFocused = 
        document.visibilityState === "visible" && 
        (timeSinceLastTouch < 30000 || timeSinceLastVisibilityChange < 30000);
      
      // 비활성 상태가 지속되면 카운트 증가
      if (!isFocused) {
        inactivityCountRef.current += 1;
      } else {
        // 활성 상태면 카운트 리셋
        inactivityCountRef.current = 0;
      }
      
      // 포커스 데이터 추가
      setFocusDataList(prev => [
        ...prev,
        {
          timestamp,
          isFocused,
          eventType: "timer"
        }
      ]);
    };

    // 30초마다 집중도 체크
    checkIntervalRef.current = setInterval(checkFocus, 30000);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isActive]);

  // 집중도 저하 원인 분석
  const analyzeFocusDeclineReason = (focusRate: number, focusDataList: FocusData[]): { reason: string; type: "inactivity" | "distraction" | "fatigue" | "general" } => {
    // 이전 집중도와 현재 집중도 비교
    const focusRateDrop = lastFocusRateRef.current - focusRate;
    
    // 탭 전환 횟수 확인
    const recentTabSwitches = tabSwitchCountRef.current;
    
    // 비활성 상태 지속 시간 확인
    const inactivityPeriods = inactivityCountRef.current;
    
    // 세션 지속 시간 (분 단위)
    const sessionDuration = focusDataList.length > 0 
      ? Math.floor((Date.now() - focusDataList[0].timestamp) / 60000) 
      : 0;
    
    // 집중도 저하 원인 분석
    if (recentTabSwitches > 3) {
      return { 
        reason: "다른 앱이나 웹사이트로 자주 전환하고 있습니다. 학습 중에는 불필요한 탭을 닫고 집중하세요.", 
        type: "distraction" 
      };
    } else if (inactivityPeriods > 2) {
      return { 
        reason: "장시간 활동이 없습니다. 화면을 보고 있지만 내용에 집중하지 않는 것 같습니다.", 
        type: "inactivity" 
      };
    } else if (sessionDuration > 45 && focusRateDrop > 15) {
      return { 
        reason: "장시간 학습으로 인한 피로가 감지됩니다. 짧은 휴식을 취하고 다시 시작하는 것이 좋습니다.", 
        type: "fatigue" 
      };
    } else {
      return { 
        reason: "집중도가 떨어지고 있습니다. 심호흡을 하고 주의를 다시 학습에 집중해보세요.", 
        type: "general" 
      };
    }
  };

  // 집중도 계산 및 알림 표시
  useEffect(() => {
    if (!isActive || focusDataList.length === 0) return;
    
    // 집중도 계산
    const focusRate = calculateFocusRate(focusDataList);
    setCurrentFocusRate(focusRate);
    onFocusRateChange(focusRate);
    
    // 집중도 하락 예측
    const isFocusDecline = predictFocusDecline(focusDataList) || (lastFocusRateRef.current - focusRate >= 10);
    
    // 집중도가 하락했거나 70% 미만이면 알림 표시
    if (isFocusDecline || focusRate < 70) {
      // 집중도 저하 원인 분석
      const { reason, type } = analyzeFocusDeclineReason(focusRate, focusDataList);
      setFocusDeclineReason(reason);
      setFocusDeclineType(type);
      
      setShowAlert(true);
      setPlayAlertSound(true);
      
      // 10초 후 알림 자동 닫기
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      
      alertTimeoutRef.current = setTimeout(() => {
        setShowAlert(false);
        alertTimeoutRef.current = null;
      }, 10000);
    }
    
    // 현재 집중도 저장
    lastFocusRateRef.current = focusRate;
  }, [focusDataList, isActive, onFocusRateChange]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // 알림 닫기
  const handleCloseAlert = () => {
    setShowAlert(false);
    setPlayAlertSound(false);
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
  };

  // 알림 소리 종료 처리
  const handleSoundEnded = () => {
    setPlayAlertSound(false);
  };

  // 집중도 저하 유형에 따른 아이콘 선택
  const getFocusDeclineIcon = () => {
    switch (focusDeclineType) {
      case "inactivity":
        return <Clock className="h-5 w-5 mr-2 text-yellow-600" />;
      case "distraction":
        return <Smartphone className="h-5 w-5 mr-2 text-yellow-600" />;
      case "fatigue":
        return <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />;
      default:
        return <Volume2 className="h-5 w-5 mr-2 text-yellow-600" />;
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* 알림 소리 */}
      <SoundPlayer
        soundUrl="/alert.mp3"
        play={playAlertSound}
        volume={0.7}
        loop={false}
        onEnded={handleSoundEnded}
      />

      {/* 알림 배너 */}
      {showAlert && (
        <div className="fixed bottom-20 left-0 right-0 mx-auto w-full max-w-md px-4 z-50">
          <Alert className="bg-yellow-50 border-yellow-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <AlertTitle className="text-yellow-800 flex items-center">
                  {getFocusDeclineIcon()}
                  집중도 알림: {currentFocusRate}%
                </AlertTitle>
                <AlertDescription className="text-yellow-700 mt-1">
                  {focusDeclineReason}
                </AlertDescription>
                <div className="mt-2 text-xs text-yellow-600">
                  {focusDeclineType === "distraction" && "💡 팁: 학습 중에는 SNS와 메신저 알림을 끄세요."}
                  {focusDeclineType === "inactivity" && "💡 팁: 능동적으로 내용을 정리하며 학습하세요."}
                  {focusDeclineType === "fatigue" && "💡 팁: 25분 학습 후 5분 휴식하는 포모도로 기법을 시도해보세요."}
                  {focusDeclineType === "general" && "💡 팁: 물 한 잔 마시고 심호흡을 해보세요."}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-yellow-800 flex-shrink-0 ml-2" 
                onClick={handleCloseAlert}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </>
  );
} 