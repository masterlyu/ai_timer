"use client";

import { SessionData } from './aiUtils';
import { getAllSessions, getSessionsByDateRange } from './dbUtils';

export interface StatsSummary {
  totalSessions: number;
  totalStudyTime: number; // 초 단위
  averageFocusRate: number; // 0-100 사이의 값
  averageSessionDuration: number; // 초 단위
  completionRate: number; // 0-100 사이의 값
  bestStudyDay: string;
  bestStudyTime: string;
  mostProductiveTimeOfDay: string;
  studyStreak: number; // 연속 학습일 수
  lastWeekComparison: {
    studyTimeChange: number; // 백분율 (양수: 증가, 음수: 감소)
    focusRateChange: number; // 백분율 (양수: 증가, 음수: 감소)
    sessionCountChange: number; // 백분율 (양수: 증가, 음수: 감소)
  };
  focusRateReason?: string; // 집중도 점수 계산 이유
  focusIssues?: string[]; // 집중도 저하 요인
}

export interface FeedbackItem {
  type: 'positive' | 'suggestion' | 'warning';
  message: string;
  actionable: boolean;
  action?: string;
}

/**
 * 주어진 세션 데이터에서 통계 요약을 생성합니다.
 */
export async function generateStatsSummary(days: number = 30): Promise<StatsSummary> {
  try {
    // 지정된 기간의 세션 데이터 가져오기
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const sessions = await getSessionsByDateRange(startDate, endDate);
    
    if (sessions.length === 0) {
      return getEmptyStatsSummary();
    }
    
    // 기본 통계 계산
    const totalSessions = sessions.length;
    const totalStudyTime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const averageFocusRate = Math.round(sessions.reduce((sum, session) => sum + session.focusRate, 0) / totalSessions);
    const averageSessionDuration = totalStudyTime / totalSessions;
    const completedSessions = sessions.filter(session => session.completedSuccessfully);
    const completionRate = Math.round((completedSessions.length / totalSessions) * 100);
    
    // 요일별 세션 그룹화
    const sessionsByDay = groupSessionsByDay(sessions);
    const bestStudyDay = findBestStudyDay(sessionsByDay);
    
    // 시간대별 세션 그룹화
    const sessionsByHour = groupSessionsByHour(sessions);
    const bestStudyTime = findBestStudyTime(sessionsByHour);
    
    // 가장 생산적인 시간대 찾기
    const mostProductiveTimeOfDay = findMostProductiveTimeOfDay(sessions);
    
    // 연속 학습일 수 계산
    const studyStreak = calculateStudyStreak(sessions);
    
    // 지난 주와 비교
    const lastWeekComparison = await compareWithLastWeek();
    
    // 집중도 저하 요인 분석
    const focusIssues = analyzeFocusIssues(sessions);
    
    // 집중도 점수 계산 이유
    const focusRateReason = generateFocusRateReason(averageFocusRate, focusIssues);
    
    return {
      totalSessions,
      totalStudyTime,
      averageFocusRate,
      averageSessionDuration,
      completionRate,
      bestStudyDay,
      bestStudyTime,
      mostProductiveTimeOfDay,
      studyStreak,
      lastWeekComparison,
      focusRateReason,
      focusIssues
    };
  } catch (error) {
    console.error('통계 요약 생성 중 오류 발생:', error);
    return getEmptyStatsSummary();
  }
}

/**
 * 사용자의 학습 패턴에 기반한 피드백을 생성합니다.
 */
export async function generateFeedback(): Promise<FeedbackItem[]> {
  try {
    const feedback: FeedbackItem[] = [];
    const stats = await generateStatsSummary();
    
    // 학습 시간 관련 피드백
    if (stats.totalStudyTime < 3600) { // 하루 1시간 미만
      feedback.push({
        type: 'suggestion',
        message: '학습 시간이 다소 부족합니다. 하루에 최소 1시간 이상 학습하는 것을 목표로 해보세요.',
        actionable: true,
        action: '오늘 목표: 1시간 학습하기'
      });
    } else if (stats.totalStudyTime > 14400) { // 하루 4시간 초과
      feedback.push({
        type: 'warning',
        message: '학습 시간이 매우 깁니다. 적절한 휴식을 취하며 학습 효율을 높이는 것이 중요합니다.',
        actionable: true,
        action: '25분 학습 후 5분 휴식하기'
      });
    } else {
      feedback.push({
        type: 'positive',
        message: '학습 시간이 적절합니다. 꾸준히 유지하세요!',
        actionable: false
      });
    }
    
    // 집중도 관련 피드백
    if (stats.averageFocusRate < 60) {
      // 집중도 저하 요인에 따른 구체적인 피드백
      if (stats.focusIssues && stats.focusIssues.length > 0) {
        stats.focusIssues.forEach(issue => {
          let feedbackMessage = '';
          let actionMessage = '';
          
          if (issue.includes('디지털 기기')) {
            feedbackMessage = '디지털 기기 사용이 집중도를 저하시키고 있습니다. 학습 중에는 스마트폰과 불필요한 앱을 끄는 것이 좋습니다.';
            actionMessage = '학습 시 방해 금지 모드 활성화하기';
          } else if (issue.includes('소음')) {
            feedbackMessage = '주변 소음이 집중도를 저하시키고 있습니다. 조용한 환경이나 백색 소음을 활용해보세요.';
            actionMessage = '백색 소음 재생하기';
          } else if (issue.includes('피로')) {
            feedbackMessage = '피로감이 집중도를 저하시키고 있습니다. 충분한 수면과 규칙적인 휴식이 필요합니다.';
            actionMessage = '포모도로 기법으로 휴식 시간 확보하기';
          } else if (issue.includes('학습 시간')) {
            feedbackMessage = '너무 긴 학습 시간이 집중도를 저하시키고 있습니다. 짧게 나누어 학습하는 것이 효과적입니다.';
            actionMessage = '25분 단위로 학습 세션 나누기';
          } else {
            feedbackMessage = '집중도가 다소 낮습니다. 방해 요소를 제거하고 집중력을 높이는 환경을 만들어보세요.';
            actionMessage = '집중 모드 활성화하기';
          }
          
          feedback.push({
            type: 'suggestion',
            message: feedbackMessage,
            actionable: true,
            action: actionMessage
          });
        });
      } else {
        feedback.push({
          type: 'suggestion',
          message: '집중도가 다소 낮습니다. 방해 요소를 제거하고 집중력을 높이는 환경을 만들어보세요.',
          actionable: true,
          action: '집중 모드 활성화하기'
        });
      }
    } else if (stats.averageFocusRate >= 85) {
      feedback.push({
        type: 'positive',
        message: '집중도가 매우 높습니다! 현재의 학습 환경과 방식을 유지하세요.',
        actionable: false
      });
    } else {
      feedback.push({
        type: 'suggestion',
        message: '집중도가 양호합니다. 더 높은 집중도를 위해 정기적인 짧은 휴식을 취해보세요.',
        actionable: true,
        action: '50분 학습 후 10분 휴식하기'
      });
    }
    
    // 완료율 관련 피드백
    if (stats.completionRate < 70) {
      feedback.push({
        type: 'suggestion',
        message: '세션 완료율이 낮습니다. 더 짧은 세션으로 시작해 성취감을 높여보세요.',
        actionable: true,
        action: '15분 세션으로 시작하기'
      });
    } else if (stats.completionRate >= 90) {
      feedback.push({
        type: 'positive',
        message: '세션 완료율이 매우 높습니다! 목표 설정과 실행력이 뛰어납니다.',
        actionable: false
      });
    }
    
    // 최적 학습 시간 관련 피드백
    if (stats.bestStudyTime) {
      feedback.push({
        type: 'suggestion',
        message: `${stats.bestStudyTime}에 집중도가 가장 높습니다. 이 시간대에 중요한 학습을 계획해보세요.`,
        actionable: true,
        action: `${stats.bestStudyTime}에 학습 알림 설정하기`
      });
    }
    
    // 학습 연속일 관련 피드백
    if (stats.studyStreak >= 3) {
      feedback.push({
        type: 'positive',
        message: `${stats.studyStreak}일 연속으로 학습 중입니다! 꾸준함이 실력으로 이어집니다.`,
        actionable: false
      });
    }
    
    // 지난 주 비교 피드백
    if (stats.lastWeekComparison.studyTimeChange > 10) {
      feedback.push({
        type: 'positive',
        message: `지난 주보다 학습 시간이 ${Math.round(stats.lastWeekComparison.studyTimeChange)}% 증가했습니다! 좋은 추세입니다.`,
        actionable: false
      });
    } else if (stats.lastWeekComparison.studyTimeChange < -10) {
      feedback.push({
        type: 'warning',
        message: `지난 주보다 학습 시간이 ${Math.abs(Math.round(stats.lastWeekComparison.studyTimeChange))}% 감소했습니다. 학습 계획을 재점검해보세요.`,
        actionable: true,
        action: '주간 학습 계획 세우기'
      });
    }
    
    return feedback;
  } catch (error) {
    console.error('피드백 생성 중 오류 발생:', error);
    return [{
      type: 'suggestion',
      message: '더 많은 세션을 완료하면 맞춤형 피드백을 제공해드릴 수 있습니다.',
      actionable: false
    }];
  }
}

/**
 * 빈 통계 요약을 반환합니다.
 */
function getEmptyStatsSummary(): StatsSummary {
  return {
    totalSessions: 0,
    totalStudyTime: 0,
    averageFocusRate: 0,
    averageSessionDuration: 0,
    completionRate: 0,
    bestStudyDay: '',
    bestStudyTime: '',
    mostProductiveTimeOfDay: '',
    studyStreak: 0,
    lastWeekComparison: {
      studyTimeChange: 0,
      focusRateChange: 0,
      sessionCountChange: 0
    },
    focusRateReason: '',
    focusIssues: []
  };
}

/**
 * 세션을 요일별로 그룹화합니다.
 */
function groupSessionsByDay(sessions: SessionData[]): Record<string, SessionData[]> {
  const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  
  return sessions.reduce((acc: Record<string, SessionData[]>, session) => {
    const date = new Date(session.date);
    const dayName = dayNames[date.getDay()];
    
    if (!acc[dayName]) {
      acc[dayName] = [];
    }
    
    acc[dayName].push(session);
    return acc;
  }, {});
}

/**
 * 세션을 시간대별로 그룹화합니다.
 */
function groupSessionsByHour(sessions: SessionData[]): Record<string, SessionData[]> {
  return sessions.reduce((acc: Record<string, SessionData[]>, session) => {
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
}

/**
 * 가장 집중도가 높은 요일을 찾습니다.
 */
function findBestStudyDay(sessionsByDay: Record<string, SessionData[]>): string {
  let bestDay = '';
  let bestDayFocusRate = 0;
  
  Object.entries(sessionsByDay).forEach(([day, sessions]) => {
    const dayFocusRate = sessions.reduce((sum, session) => sum + session.focusRate, 0) / sessions.length;
    if (dayFocusRate > bestDayFocusRate) {
      bestDayFocusRate = dayFocusRate;
      bestDay = day;
    }
  });
  
  return bestDay;
}

/**
 * 가장 집중도가 높은 시간대를 찾습니다.
 */
function findBestStudyTime(sessionsByHour: Record<string, SessionData[]>): string {
  let bestTime = '';
  let bestTimeFocusRate = 0;
  
  Object.entries(sessionsByHour).forEach(([time, sessions]) => {
    const timeFocusRate = sessions.reduce((sum, session) => sum + session.focusRate, 0) / sessions.length;
    if (timeFocusRate > bestTimeFocusRate) {
      bestTimeFocusRate = timeFocusRate;
      bestTime = time;
    }
  });
  
  return bestTime;
}

/**
 * 가장 생산적인 시간대를 찾습니다.
 */
function findMostProductiveTimeOfDay(sessions: SessionData[]): string {
  const morningCount = sessions.filter(session => {
    const hour = new Date(session.date).getHours();
    return hour >= 5 && hour < 12;
  }).length;
  
  const afternoonCount = sessions.filter(session => {
    const hour = new Date(session.date).getHours();
    return hour >= 12 && hour < 18;
  }).length;
  
  const eveningCount = sessions.filter(session => {
    const hour = new Date(session.date).getHours();
    return hour >= 18 && hour < 22;
  }).length;
  
  const nightCount = sessions.filter(session => {
    const hour = new Date(session.date).getHours();
    return hour >= 22 || hour < 5;
  }).length;
  
  const counts = [
    { time: '아침', count: morningCount },
    { time: '오후', count: afternoonCount },
    { time: '저녁', count: eveningCount },
    { time: '밤', count: nightCount }
  ];
  
  counts.sort((a, b) => b.count - a.count);
  
  return counts[0].count > 0 ? counts[0].time : '';
}

/**
 * 연속 학습일 수를 계산합니다.
 */
function calculateStudyStreak(sessions: SessionData[]): number {
  if (sessions.length === 0) return 0;
  
  // 날짜별로 세션 그룹화
  const sessionsByDate: Record<string, boolean> = {};
  sessions.forEach(session => {
    const date = new Date(session.date);
    const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    sessionsByDate[dateString] = true;
  });
  
  // 오늘 날짜
  const today = new Date();
  const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  
  // 오늘 학습했는지 확인
  if (!sessionsByDate[todayString]) {
    return 0; // 오늘 학습하지 않았으면 연속 0일
  }
  
  // 연속 학습일 계산
  let streak = 1; // 오늘 포함
  let currentDate = new Date(today);
  
  while (true) {
    currentDate.setDate(currentDate.getDate() - 1); // 하루 전
    const dateString = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    
    if (sessionsByDate[dateString]) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * 지난 주와 현재 주의 통계를 비교합니다.
 */
async function compareWithLastWeek(): Promise<{ studyTimeChange: number; focusRateChange: number; sessionCountChange: number }> {
  try {
    // 이번 주 (최근 7일)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const thisWeekSessions = await getSessionsByDateRange(startDate, endDate);
    
    // 지난 주 (8-14일 전)
    const lastWeekEndDate = new Date(startDate);
    lastWeekEndDate.setDate(lastWeekEndDate.getDate() - 1);
    const lastWeekStartDate = new Date(lastWeekEndDate);
    lastWeekStartDate.setDate(lastWeekStartDate.getDate() - 7);
    
    const lastWeekSessions = await getSessionsByDateRange(lastWeekStartDate, lastWeekEndDate);
    
    // 데이터가 없는 경우 변화 없음으로 처리
    if (lastWeekSessions.length === 0) {
      return { studyTimeChange: 0, focusRateChange: 0, sessionCountChange: 0 };
    }
    
    // 학습 시간 변화
    const thisWeekStudyTime = thisWeekSessions.reduce((sum, session) => sum + session.duration, 0);
    const lastWeekStudyTime = lastWeekSessions.reduce((sum, session) => sum + session.duration, 0);
    const studyTimeChange = lastWeekStudyTime > 0 
      ? ((thisWeekStudyTime - lastWeekStudyTime) / lastWeekStudyTime) * 100 
      : 0;
    
    // 집중도 변화
    const thisWeekFocusRate = thisWeekSessions.length > 0
      ? thisWeekSessions.reduce((sum, session) => sum + session.focusRate, 0) / thisWeekSessions.length
      : 0;
    const lastWeekFocusRate = lastWeekSessions.length > 0
      ? lastWeekSessions.reduce((sum, session) => sum + session.focusRate, 0) / lastWeekSessions.length
      : 0;
    const focusRateChange = lastWeekFocusRate > 0
      ? ((thisWeekFocusRate - lastWeekFocusRate) / lastWeekFocusRate) * 100
      : 0;
    
    // 세션 수 변화
    const sessionCountChange = lastWeekSessions.length > 0
      ? ((thisWeekSessions.length - lastWeekSessions.length) / lastWeekSessions.length) * 100
      : 0;
    
    return {
      studyTimeChange,
      focusRateChange,
      sessionCountChange
    };
  } catch (error) {
    console.error('주간 비교 중 오류 발생:', error);
    return { studyTimeChange: 0, focusRateChange: 0, sessionCountChange: 0 };
  }
}

/**
 * 세션 데이터를 분석하여 집중도 저하 요인을 파악합니다.
 */
function analyzeFocusIssues(sessions: SessionData[]): string[] {
  const issues: string[] = [];
  
  // 세션 중단 패턴 분석
  const interruptedSessions = sessions.filter(session => !session.completedSuccessfully);
  if (interruptedSessions.length > sessions.length * 0.3) {
    issues.push('잦은 세션 중단');
  }
  
  // 시간대별 집중도 분석
  const lateNightSessions = sessions.filter(session => {
    const hour = new Date(session.date).getHours();
    return (hour >= 22 || hour < 5);
  });
  
  if (lateNightSessions.length > 0) {
    const lateNightFocusRate = lateNightSessions.reduce((sum, session) => sum + session.focusRate, 0) / lateNightSessions.length;
    if (lateNightFocusRate < 70) {
      issues.push('늦은 시간 학습으로 인한 피로');
    }
  }
  
  // 세션 길이와 집중도 관계 분석
  const longSessions = sessions.filter(session => session.duration > 3600); // 1시간 이상
  if (longSessions.length > 0) {
    const longSessionsFocusRate = longSessions.reduce((sum, session) => sum + session.focusRate, 0) / longSessions.length;
    if (longSessionsFocusRate < 70) {
      issues.push('너무 긴 학습 시간');
    }
  }
  
  // 디지털 기기 사용 패턴 (메타데이터에서 추출 가능한 경우)
  const distractionSessions = sessions.filter(session => 
    session.metadata && 
    session.metadata.distractions && 
    session.metadata.distractions.includes('digital')
  );
  
  if (distractionSessions.length > sessions.length * 0.2) {
    issues.push('디지털 기기 사용으로 인한 방해');
  }
  
  // 환경 요인 (메타데이터에서 추출 가능한 경우)
  const noisySessions = sessions.filter(session => 
    session.metadata && 
    session.metadata.environment && 
    session.metadata.environment.includes('noisy')
  );
  
  if (noisySessions.length > sessions.length * 0.2) {
    issues.push('주변 소음으로 인한 방해');
  }
  
  return issues;
}

/**
 * 집중도 점수 계산 이유를 생성합니다.
 */
export function generateFocusRateReason(focusRate: number, issues: string[]): string {
  if (focusRate >= 90) {
    return '최상위 집중도입니다. 학습에 완전히 몰입하고 있으며, 방해 요소가 거의 없습니다.';
  } else if (focusRate >= 80) {
    return '매우 좋은 집중도입니다. 대부분의 시간을 효율적으로 활용하고 있습니다.';
  } else if (focusRate >= 70) {
    return '양호한 집중도입니다. 간헐적인 방해가 있지만 대체로 집중하고 있습니다.';
  } else if (focusRate >= 60) {
    return '보통 수준의 집중도입니다. 개선의 여지가 있으며, 방해 요소를 줄이면 더 효율적인 학습이 가능합니다.';
  } else if (focusRate >= 50) {
    if (issues.length > 0) {
      return `집중도가 다소 낮습니다. 주요 원인: ${issues.join(', ')}`;
    }
    return '집중도가 다소 낮습니다. 학습 환경과 방식을 개선할 필요가 있습니다.';
  } else {
    if (issues.length > 0) {
      return `집중도가 매우 낮습니다. 주요 원인: ${issues.join(', ')}`;
    }
    return '집중도가 매우 낮습니다. 학습 환경을 재구성하고 집중 방해 요소를 제거해야 합니다.';
  }
} 