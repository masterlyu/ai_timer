"use client";

// 사용자 세션 데이터 타입
export interface SessionData {
  date: string; // ISO 문자열 형식 (new Date().toISOString())
  duration: number; // 초 단위
  focusRate: number; // 0-100 사이의 값
  timeOfDay: number; // 0-23 사이의 값 (시간)
  completedSuccessfully: boolean;
  metadata?: {
    distractions?: string[]; // 방해 요소 (예: 'digital', 'noise', 'fatigue')
    environment?: string[]; // 환경 요소 (예: 'noisy', 'quiet', 'crowded')
    notes?: string; // 사용자 메모
    focusEvents?: number; // 집중 이벤트 수
    unfocusEvents?: number; // 집중 해제 이벤트 수
  };
}

// 집중도 데이터 타입
export interface FocusData {
  timestamp: number; // 밀리초 단위 타임스탬프
  isFocused: boolean; // 집중 여부
  eventType: 'visibility' | 'touch' | 'timer'; // 이벤트 유형
}

/**
 * 로컬 스토리지에서 세션 데이터를 가져옵니다.
 */
export function getSessionHistory(): SessionData[] {
  try {
    const data = localStorage.getItem('sessionHistory');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('세션 데이터를 가져오는 중 오류 발생:', error);
    return [];
  }
}

/**
 * 세션 데이터를 로컬 스토리지에 저장합니다.
 */
export function saveSessionData(session: SessionData): void {
  try {
    const history = getSessionHistory();
    history.push(session);
    
    // 최대 30개의 세션만 저장 (메모리 관리)
    if (history.length > 30) {
      history.shift();
    }
    
    localStorage.setItem('sessionHistory', JSON.stringify(history));
  } catch (error) {
    console.error('세션 데이터를 저장하는 중 오류 발생:', error);
  }
}

/**
 * 현재 시간대에 가장 적합한 공부 시간을 추천합니다.
 * @returns 추천 공부 시간 (초 단위)
 */
export async function recommendStudyDuration(): Promise<number> {
  try {
    // IndexedDB에서 세션 데이터 가져오기 시도
    const { getAllSessions } = await import('./dbUtils');
    const sessions = await getAllSessions();
    
    // 세션 기록이 없으면 기본값 25분 반환
    if (sessions.length === 0) {
      return 25 * 60;
    }
    
    // 현재 시간
    const currentHour = new Date().getHours();
    
    // 현재 시간대와 비슷한 시간대의 세션 필터링 (±2시간)
    const relevantSessions = sessions.filter(session => {
      const sessionHour = new Date(session.date).getHours();
      return Math.abs(sessionHour - currentHour) <= 2;
    });
    
    // 관련 세션이 없으면 전체 세션의 평균 또는 기본값 반환
    if (relevantSessions.length === 0) {
      // 전체 세션의 평균 계산
      if (sessions.length > 0) {
        const avgDuration = sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length;
        // 평균 시간을 5분 단위로 반올림
        return Math.round(avgDuration / 300) * 300;
      }
      return 25 * 60; // 기본값 25분
    }
    
    // 관련 세션 중 성공적으로 완료된 세션만 필터링
    const successfulSessions = relevantSessions.filter(session => session.completedSuccessfully);
    
    // 성공적인 세션이 있으면 그 평균 사용, 없으면 모든 관련 세션의 평균 사용
    const sessionsToUse = successfulSessions.length > 0 ? successfulSessions : relevantSessions;
    
    // 평균 지속 시간 계산
    const avgDuration = sessionsToUse.reduce((sum, session) => sum + session.duration, 0) / sessionsToUse.length;
    
    // 5분 단위로 반올림
    const roundedDuration = Math.round(avgDuration / 300) * 300;
    
    // 최소 10분, 최대 60분으로 제한
    return Math.min(Math.max(roundedDuration, 10 * 60), 60 * 60);
  } catch (error) {
    console.error('IndexedDB에서 세션 데이터를 가져오는 중 오류 발생:', error);
    
    // 오류 발생 시 로컬 스토리지에서 가져오기
    const history = getSessionHistory();
    
    // 세션 기록이 없으면 기본값 25분 반환
    if (history.length === 0) {
      return 25 * 60;
    }
    
    // 현재 시간
    const currentHour = new Date().getHours();
    
    // 현재 시간대와 비슷한 시간대의 세션 필터링 (±2시간)
    const relevantSessions = history.filter(session => {
      const sessionHour = new Date(session.date).getHours();
      return Math.abs(sessionHour - currentHour) <= 2;
    });
    
    // 관련 세션이 없으면 전체 세션의 평균 또는 기본값 반환
    if (relevantSessions.length === 0) {
      // 전체 세션의 평균 계산
      if (history.length > 0) {
        const avgDuration = history.reduce((sum, session) => sum + session.duration, 0) / history.length;
        // 평균 시간을 5분 단위로 반올림
        return Math.round(avgDuration / 300) * 300;
      }
      return 25 * 60; // 기본값 25분
    }
    
    // 관련 세션 중 성공적으로 완료된 세션만 필터링
    const successfulSessions = relevantSessions.filter(session => session.completedSuccessfully);
    
    // 성공적인 세션이 있으면 그 평균 사용, 없으면 모든 관련 세션의 평균 사용
    const sessionsToUse = successfulSessions.length > 0 ? successfulSessions : relevantSessions;
    
    // 평균 지속 시간 계산
    const avgDuration = sessionsToUse.reduce((sum, session) => sum + session.duration, 0) / sessionsToUse.length;
    
    // 5분 단위로 반올림
    const roundedDuration = Math.round(avgDuration / 300) * 300;
    
    // 최소 10분, 최대 60분으로 제한
    return Math.min(Math.max(roundedDuration, 10 * 60), 60 * 60);
  }
}

/**
 * 현재 집중도를 계산합니다.
 * @param focusDataList 집중도 데이터 배열
 * @returns 집중도 (0-100 사이의 값)
 */
export function calculateFocusRate(focusDataList: FocusData[]): number {
  if (focusDataList.length === 0) return 100;
  
  // 최근 데이터에 더 높은 가중치 부여
  const weightedFocusData = focusDataList.map((data, index) => {
    // 최근 데이터일수록 가중치 증가 (최대 1.5배)
    const weight = 1 + (index / focusDataList.length) * 0.5;
    return {
      ...data,
      weight
    };
  });
  
  // 가중치가 적용된 집중 상태 계산
  const totalWeight = weightedFocusData.reduce((sum, data) => sum + data.weight, 0);
  const weightedFocusedSum = weightedFocusData
    .filter(data => data.isFocused)
    .reduce((sum, data) => sum + data.weight, 0);
  
  // 집중도 계산 (0-100 사이의 값)
  return Math.round((weightedFocusedSum / totalWeight) * 100);
}

/**
 * 집중도 하락 여부를 예측합니다.
 * @param focusDataList 집중도 데이터 배열
 * @returns 집중도 하락 여부
 */
export function predictFocusDecline(focusDataList: FocusData[]): boolean {
  // 데이터가 10개 미만이면 예측하지 않음
  if (focusDataList.length < 10) return false;
  
  // 최근 5개의 데이터
  const recentData = focusDataList.slice(-5);
  // 그 이전 5개의 데이터
  const previousData = focusDataList.slice(-10, -5);
  
  // 각 기간의 집중 상태 비율 계산
  const recentFocusRate = recentData.filter(data => data.isFocused).length / recentData.length;
  const previousFocusRate = previousData.filter(data => data.isFocused).length / previousData.length;
  
  // 최근 집중도가 이전보다 20% 이상 하락했는지 확인
  const significantDecline = (previousFocusRate - recentFocusRate) > 0.2;
  
  // 최근 3개의 연속된 비집중 상태 확인
  const recentConsecutiveUnfocused = 
    recentData.length >= 3 && 
    !recentData[recentData.length - 1].isFocused && 
    !recentData[recentData.length - 2].isFocused && 
    !recentData[recentData.length - 3].isFocused;
  
  return significantDecline || recentConsecutiveUnfocused;
}

/**
 * 집중도 점수에 대한 설명을 생성합니다.
 * @param focusRate 집중도 점수 (0-100)
 * @returns 집중도 점수에 대한 설명
 */
export function getFocusRateDescription(focusRate: number): string {
  if (focusRate >= 90) {
    return "최상위 집중도입니다. 학습에 완전히 몰입하고 있습니다.";
  } else if (focusRate >= 80) {
    return "매우 좋은 집중도입니다. 대부분의 시간을 효율적으로 활용하고 있습니다.";
  } else if (focusRate >= 70) {
    return "양호한 집중도입니다. 간헐적인 방해가 있지만 대체로 집중하고 있습니다.";
  } else if (focusRate >= 60) {
    return "보통 수준의 집중도입니다. 개선의 여지가 있습니다.";
  } else if (focusRate >= 50) {
    return "집중도가 다소 낮습니다. 학습 환경과 방식을 개선할 필요가 있습니다.";
  } else {
    return "집중도가 매우 낮습니다. 학습 환경을 재구성하고 집중 방해 요소를 제거해야 합니다.";
  }
} 