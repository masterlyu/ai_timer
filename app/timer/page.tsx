"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/context/UserContext";
import { useSession } from "next-auth/react";
import { Timer } from "@/components/Timer";
import { StudyStats } from "@/components/StudyStats";
import { StatsView } from "@/components/StatsView";
import { SettingsView } from "@/components/SettingsView";
import { getSessionHistory, SessionData } from "@/lib/aiUtils";
import { getAllSessions, getSessionsByDateRange, saveSetting, getSetting } from "@/lib/dbUtils";
import { generateStatsSummary } from "@/lib/statsUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TimerPage() {
  const { userInfo, isUserInfoSet } = useUser();
  const { status, data: session } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("timer");
  
  // 세션 정보 디버깅 useEffect 수정
  useEffect(() => {
    if (status === "authenticated" && session) {
      // 디버깅 로그 제거
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session, router]);
  
  // 오늘의 공부 시간과 집중도
  const [totalStudyTime, setTotalStudyTime] = useState(0); // 초 단위
  const [focusRate, setFocusRate] = useState(0); // 0-100 사이의 값
  
  // 주간 통계 데이터
  const [weeklyStudyTime, setWeeklyStudyTime] = useState(0); // 초 단위
  const [weeklyFocusRate, setWeeklyFocusRate] = useState(0); // 0-100 사이의 값
  const [bestStudyDay, setBestStudyDay] = useState("월요일");
  const [bestStudyTime, setBestStudyTime] = useState("오전 10시-12시");
  
  // 타이머 상태를 페이지 레벨에서 관리
  const [currentTime, setCurrentTime] = useState(25 * 60); // 기본 25분
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // 타이머 상태 변경 핸들러
  const handleTimerStateChange = useCallback((
    time: number, 
    active: boolean, 
    paused: boolean, 
    rate: number
  ) => {
    setCurrentTime(time);
    setIsActive(active);
    setIsPaused(paused);
    setFocusRate(rate);
  }, []);
  
  // 타이머 완료 핸들러
  const handleTimerComplete = useCallback(() => {
    // 타이머 완료 시 상태 초기화
    setCurrentTime(25 * 60);
    setIsActive(false);
    setIsPaused(false);
    setFocusRate(100);
  }, []);
  
  // 통계 업데이트
  const updateStats = async () => {
    try {
      // IndexedDB에서 세션 데이터 가져오기
      const sessionHistory = await getAllSessions();
      
      if (sessionHistory.length === 0) return;
      
      // 오늘 날짜
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 오늘의 세션만 필터링
      const todaySessions = sessionHistory.filter((session: SessionData) => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime();
      });
      
      // 오늘의 총 공부 시간 계산
      const newTotalStudyTime = todaySessions.reduce((sum: number, session: SessionData) => sum + session.duration, 0);
      
      // 오늘의 평균 집중도 계산
      const newFocusRate = todaySessions.length > 0
        ? Math.round(todaySessions.reduce((sum: number, session: SessionData) => sum + session.focusRate, 0) / todaySessions.length)
        : 0;
      
      // 상태 업데이트
      setTotalStudyTime(newTotalStudyTime);
      setFocusRate(newFocusRate);
      
      // IndexedDB에 저장
      await saveSetting('todayStats', {
        totalStudyTime: newTotalStudyTime,
        focusRate: newFocusRate,
        date: today.toISOString()
      });
      
      // 로컬 스토리지에도 백업으로 저장
      localStorage.setItem("todayStats", JSON.stringify({
        totalStudyTime: newTotalStudyTime,
        focusRate: newFocusRate,
      }));
      
      // 주간 통계 업데이트
      await updateWeeklyStats();
      
      // 상세 통계 생성
      await generateStatsSummary();
    } catch (error) {
      console.error("통계 업데이트 중 오류 발생:", error);
      
      // 오류 발생 시 로컬 스토리지에서 가져오기
      const sessionHistory = getSessionHistory();
      if (sessionHistory.length > 0) {
        // 로컬 스토리지 기반 통계 업데이트 로직 실행
        updateStatsFromLocalStorage(sessionHistory);
      }
    }
  };
  
  // 로컬 스토리지에서 통계 업데이트 (백업 메서드)
  const updateStatsFromLocalStorage = (sessionHistory: SessionData[]) => {
    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 오늘의 세션만 필터링
    const todaySessions = sessionHistory.filter((session: SessionData) => {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    
    // 오늘의 총 공부 시간 계산
    const newTotalStudyTime = todaySessions.reduce((sum: number, session: SessionData) => sum + session.duration, 0);
    
    // 오늘의 평균 집중도 계산
    const newFocusRate = todaySessions.length > 0
      ? Math.round(todaySessions.reduce((sum: number, session: SessionData) => sum + session.focusRate, 0) / todaySessions.length)
      : 0;
    
    // 상태 업데이트
    setTotalStudyTime(newTotalStudyTime);
    setFocusRate(newFocusRate);
    
    // 로컬 스토리지에 저장
    localStorage.setItem("todayStats", JSON.stringify({
      totalStudyTime: newTotalStudyTime,
      focusRate: newFocusRate,
    }));
    
    // 주간 통계 업데이트
    updateWeeklyStatsFromLocalStorage(sessionHistory);
  };
  
  // 주간 통계 업데이트
  const updateWeeklyStats = async () => {
    try {
      // 일주일 전 날짜
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      // 최근 일주일 세션 가져오기
      const weeklySessions = await getSessionsByDateRange(weekAgo, new Date());
      
      if (weeklySessions.length === 0) return;
      
      // 주간 총 공부 시간 계산
      const newWeeklyStudyTime = weeklySessions.reduce((sum: number, session: SessionData) => sum + session.duration, 0);
      
      // 주간 평균 집중도 계산
      const newWeeklyFocusRate = Math.round(weeklySessions.reduce((sum: number, session: SessionData) => sum + session.focusRate, 0) / weeklySessions.length);
      
      // 요일별 세션 그룹화
      const sessionsByDay = weeklySessions.reduce((acc: Record<string, SessionData[]>, session: SessionData) => {
        const date = new Date(session.date);
        const day = date.getDay();
        const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
        const dayName = dayNames[day];
        
        if (!acc[dayName]) {
          acc[dayName] = [];
        }
        
        acc[dayName].push(session);
        return acc;
      }, {});
      
      // 시간대별 세션 그룹화
      const sessionsByHour = weeklySessions.reduce((acc: Record<string, SessionData[]>, session: SessionData) => {
        const hour = new Date(session.date).getHours();
        const timeRange = hour < 12 
          ? `오전 ${hour}-${hour+2}시` 
          : `오후 ${hour-12}-${hour-10}시`;
        
        if (!acc[timeRange]) {
          acc[timeRange] = [];
        }
        
        acc[timeRange].push(session);
        return acc;
      }, {});
      
      // 가장 집중도가 높은 요일 찾기
      let bestDay = "월요일";
      let bestDayFocusRate = 0;
      
      Object.entries(sessionsByDay).forEach(([day, sessions]) => {
        const dayFocusRate = sessions.reduce((sum: number, session: SessionData) => sum + session.focusRate, 0) / sessions.length;
        if (dayFocusRate > bestDayFocusRate) {
          bestDayFocusRate = dayFocusRate;
          bestDay = day;
        }
      });
      
      // 가장 집중도가 높은 시간대 찾기
      let bestTime = "오전 10-12시";
      let bestTimeFocusRate = 0;
      
      Object.entries(sessionsByHour).forEach(([time, sessions]) => {
        const timeFocusRate = sessions.reduce((sum: number, session: SessionData) => sum + session.focusRate, 0) / sessions.length;
        if (timeFocusRate > bestTimeFocusRate) {
          bestTimeFocusRate = timeFocusRate;
          bestTime = time;
        }
      });
      
      // 상태 업데이트
      setWeeklyStudyTime(newWeeklyStudyTime);
      setWeeklyFocusRate(newWeeklyFocusRate);
      setBestStudyDay(bestDay);
      setBestStudyTime(bestTime);
      
      // IndexedDB에 저장
      await saveSetting('weeklyStats', {
        weeklyStudyTime: newWeeklyStudyTime,
        weeklyFocusRate: newWeeklyFocusRate,
        bestStudyDay: bestDay,
        bestStudyTime: bestTime,
      });
      
      // 로컬 스토리지에도 백업으로 저장
      localStorage.setItem("weeklyStats", JSON.stringify({
        weeklyStudyTime: newWeeklyStudyTime,
        weeklyFocusRate: newWeeklyFocusRate,
        bestStudyDay: bestDay,
        bestStudyTime: bestTime,
      }));
    } catch (error) {
      console.error("주간 통계 업데이트 중 오류 발생:", error);
      
      // 오류 발생 시 로컬 스토리지 기반 업데이트 실행
      updateWeeklyStatsFromLocalStorage();
    }
  };
  
  // 로컬 스토리지에서 주간 통계 업데이트 (백업 메서드)
  const updateWeeklyStatsFromLocalStorage = (sessionHistory?: SessionData[]) => {
    // 세션 히스토리가 전달되지 않은 경우 로컬 스토리지에서 가져오기
    if (!sessionHistory) {
      sessionHistory = getSessionHistory();
    }
    
    // 일주일 전 날짜
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    
    // 최근 일주일 세션만 필터링
    const weeklySessions = sessionHistory.filter((session: SessionData) => {
      const sessionDate = new Date(session.date);
      return sessionDate.getTime() >= weekAgo.getTime();
    });
    
    if (weeklySessions.length === 0) return;
    
    // 주간 총 공부 시간 계산
    const newWeeklyStudyTime = weeklySessions.reduce((sum: number, session: SessionData) => sum + session.duration, 0);
    
    // 주간 평균 집중도 계산
    const newWeeklyFocusRate = Math.round(weeklySessions.reduce((sum: number, session: SessionData) => sum + session.focusRate, 0) / weeklySessions.length);
    
    // 요일별 세션 그룹화
    const sessionsByDay = weeklySessions.reduce((acc: Record<string, SessionData[]>, session: SessionData) => {
      const date = new Date(session.date);
      const day = date.getDay();
      const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
      const dayName = dayNames[day];
      
      if (!acc[dayName]) {
        acc[dayName] = [];
      }
      
      acc[dayName].push(session);
      return acc;
    }, {});
    
    // 시간대별 세션 그룹화
    const sessionsByHour = weeklySessions.reduce((acc: Record<string, SessionData[]>, session: SessionData) => {
      const hour = new Date(session.date).getHours();
      const timeRange = hour < 12 
        ? `오전 ${hour}-${hour+2}시` 
        : `오후 ${hour-12}-${hour-10}시`;
      
      if (!acc[timeRange]) {
        acc[timeRange] = [];
      }
      
      acc[timeRange].push(session);
      return acc;
    }, {});
    
    // 가장 집중도가 높은 요일 찾기
    let bestDay = "월요일";
    let bestDayFocusRate = 0;
    
    Object.entries(sessionsByDay).forEach(([day, sessions]) => {
      const dayFocusRate = sessions.reduce((sum: number, session: SessionData) => sum + session.focusRate, 0) / sessions.length;
      if (dayFocusRate > bestDayFocusRate) {
        bestDayFocusRate = dayFocusRate;
        bestDay = day;
      }
    });
    
    // 가장 집중도가 높은 시간대 찾기
    let bestTime = "오전 10-12시";
    let bestTimeFocusRate = 0;
    
    Object.entries(sessionsByHour).forEach(([time, sessions]) => {
      const timeFocusRate = sessions.reduce((sum: number, session: SessionData) => sum + session.focusRate, 0) / sessions.length;
      if (timeFocusRate > bestTimeFocusRate) {
        bestTimeFocusRate = timeFocusRate;
        bestTime = time;
      }
    });
    
    // 상태 업데이트
    setWeeklyStudyTime(newWeeklyStudyTime);
    setWeeklyFocusRate(newWeeklyFocusRate);
    setBestStudyDay(bestDay);
    setBestStudyTime(bestTime);
    
    // 로컬 스토리지에 저장
    localStorage.setItem("weeklyStats", JSON.stringify({
      weeklyStudyTime: newWeeklyStudyTime,
      weeklyFocusRate: newWeeklyFocusRate,
      bestStudyDay: bestDay,
      bestStudyTime: bestTime,
    }));
  };
  
  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    const loadStats = async () => {
      try {
        // IndexedDB에서 오늘의 통계 가져오기
        const todayStats = await getSetting('todayStats', null);
        
        if (todayStats) {
          // 오늘 날짜인지 확인
          const statsDate = new Date(todayStats.date);
          const today = new Date();
          
          statsDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          
          if (statsDate.getTime() === today.getTime()) {
            setTotalStudyTime(todayStats.totalStudyTime || 0);
            setFocusRate(todayStats.focusRate || 0);
          } else {
            // 날짜가 다르면 통계 초기화
            setTotalStudyTime(0);
            setFocusRate(0);
          }
        } else {
          // IndexedDB에 데이터가 없으면 로컬 스토리지에서 가져오기
          const storedStats = localStorage.getItem("todayStats");
          if (storedStats) {
            try {
              const { totalStudyTime, focusRate } = JSON.parse(storedStats);
              setTotalStudyTime(totalStudyTime || 0);
              setFocusRate(focusRate || 0);
            } catch (error) {
              console.error("Failed to parse study stats from localStorage:", error);
            }
          }
        }
        
        // IndexedDB에서 주간 통계 가져오기
        const weeklyStats = await getSetting('weeklyStats', null);
        
        if (weeklyStats) {
          setWeeklyStudyTime(weeklyStats.weeklyStudyTime || 0);
          setWeeklyFocusRate(weeklyStats.weeklyFocusRate || 0);
          setBestStudyDay(weeklyStats.bestStudyDay || "월요일");
          setBestStudyTime(weeklyStats.bestStudyTime || "오전 10시-12시");
        } else {
          // IndexedDB에 데이터가 없으면 로컬 스토리지에서 가져오기
          const storedWeeklyStats = localStorage.getItem("weeklyStats");
          if (storedWeeklyStats) {
            try {
              const { weeklyStudyTime, weeklyFocusRate, bestStudyDay, bestStudyTime } = JSON.parse(storedWeeklyStats);
              setWeeklyStudyTime(weeklyStudyTime || 0);
              setWeeklyFocusRate(weeklyFocusRate || 0);
              setBestStudyDay(bestStudyDay || "월요일");
              setBestStudyTime(bestStudyTime || "오전 10시-12시");
            } catch (error) {
              console.error("Failed to parse weekly stats from localStorage:", error);
            }
          } else {
            // 통계 초기화
            updateStats();
          }
        }
        
        // 상세 통계 생성
        await generateStatsSummary();
      } catch (error) {
        console.error("통계 로딩 중 오류 발생:", error);
        
        // 오류 발생 시 로컬 스토리지에서 가져오기
        const storedStats = localStorage.getItem("todayStats");
        if (storedStats) {
          try {
            const { totalStudyTime, focusRate } = JSON.parse(storedStats);
            setTotalStudyTime(totalStudyTime || 0);
            setFocusRate(focusRate || 0);
          } catch (error) {
            console.error("Failed to parse study stats from localStorage:", error);
          }
        }
        
        const storedWeeklyStats = localStorage.getItem("weeklyStats");
        if (storedWeeklyStats) {
          try {
            const { weeklyStudyTime, weeklyFocusRate, bestStudyDay, bestStudyTime } = JSON.parse(storedWeeklyStats);
            setWeeklyStudyTime(weeklyStudyTime || 0);
            setWeeklyFocusRate(weeklyFocusRate || 0);
            setBestStudyDay(bestStudyDay || "월요일");
            setBestStudyTime(bestStudyTime || "오전 10시-12시");
          } catch (error) {
            console.error("Failed to parse weekly stats from localStorage:", error);
          }
        } else {
          // 통계 초기화
          const sessionHistory = getSessionHistory();
          if (sessionHistory.length > 0) {
            updateStatsFromLocalStorage(sessionHistory);
          }
        }
      }
    };
    
    loadStats();
  }, []);

  // Redirect to login page if not authenticated
  useEffect(() => {
    if (isClient) {
      if (status === "unauthenticated" || (!isUserInfoSet && status !== "loading")) {
        router.push("/login");
      }
    }
  }, [isClient, isUserInfoSet, status, router]);

  // Show loading state until client-side rendering is complete
  if (!isClient || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  // If not authenticated, don't render the page content
  if (status === "unauthenticated" || !userInfo) {
    return null; // Will redirect to login page
  }

  // 현재 활성화된 탭에 따라 다른 컴포넌트를 렌더링
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "timer":
        return (
          <>
            {/* 상단: 오늘의 누적 공부 시간·집중도 */}
            <StudyStats totalStudyTime={totalStudyTime} focusRate={focusRate} />

            {/* 중앙: 큰 타이머 UI */}
            <div className="flex-1 flex items-center justify-center py-4">
              <Timer 
                initialTime={25 * 60}
                currentTime={currentTime}
                isActive={isActive}
                isPaused={isPaused}
                currentFocusRate={focusRate}
                onStateChange={handleTimerStateChange}
                onComplete={handleTimerComplete}
              />
            </div>
          </>
        );
      case "stats":
        return (
          <div className="flex-1 py-4">
            <StatsView 
              weeklyStudyTime={weeklyStudyTime}
              weeklyFocusRate={weeklyFocusRate}
              bestStudyDay={bestStudyDay}
              bestStudyTime={bestStudyTime}
            />
          </div>
        );
      case "settings":
        return (
          <div className="flex-1 py-4">
            <SettingsView />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Tabs defaultValue="timer" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timer">타이머</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>
        <TabsContent value="timer">
          {renderActiveTabContent()}
        </TabsContent>
        <TabsContent value="stats">
          <StatsView 
            weeklyStudyTime={weeklyStudyTime}
            weeklyFocusRate={weeklyFocusRate}
            bestStudyDay={bestStudyDay}
            bestStudyTime={bestStudyTime}
          />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsView />
        </TabsContent>
      </Tabs>
    </div>
  );
} 