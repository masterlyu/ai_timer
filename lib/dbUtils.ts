"use client";

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SessionData } from './aiUtils';

// 데이터베이스 스키마 정의
interface StudyTimerDB extends DBSchema {
  sessions: {
    key: string; // 세션 ID (날짜 + 시간)
    value: SessionData;
    indexes: {
      'by-date': string; // 날짜별 인덱스
      'by-timeOfDay': number; // 시간대별 인덱스
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

// 데이터베이스 이름과 버전
const DB_NAME = 'study-timer-db';
const DB_VERSION = 1;

// 데이터베이스 연결
async function getDB(): Promise<IDBPDatabase<StudyTimerDB>> {
  return openDB<StudyTimerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 세션 저장소 생성
      const sessionStore = db.createObjectStore('sessions', {
        keyPath: 'date'
      });
      
      // 인덱스 생성
      sessionStore.createIndex('by-date', 'date');
      sessionStore.createIndex('by-timeOfDay', 'timeOfDay');
      
      // 설정 저장소 생성
      db.createObjectStore('settings', {
        keyPath: 'key'
      });
    }
  });
}

/**
 * 세션 데이터를 IndexedDB에 저장합니다.
 */
export async function saveSessionToIndexedDB(session: SessionData): Promise<void> {
  try {
    const db = await getDB();
    await db.put('sessions', session);
    console.log('세션 데이터가 IndexedDB에 저장되었습니다.');
  } catch (error) {
    console.error('IndexedDB에 세션 데이터를 저장하는 중 오류 발생:', error);
    // 실패 시 LocalStorage에 백업
    try {
      const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
      sessionHistory.push(session);
      localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
      console.log('세션 데이터가 LocalStorage에 백업되었습니다.');
    } catch (backupError) {
      console.error('LocalStorage 백업 중 오류 발생:', backupError);
    }
  }
}

/**
 * 모든 세션 데이터를 가져옵니다.
 */
export async function getAllSessions(): Promise<SessionData[]> {
  try {
    const db = await getDB();
    return await db.getAll('sessions');
  } catch (error) {
    console.error('IndexedDB에서 세션 데이터를 가져오는 중 오류 발생:', error);
    // 실패 시 LocalStorage에서 가져오기
    try {
      const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
      return sessionHistory;
    } catch (backupError) {
      console.error('LocalStorage에서 데이터를 가져오는 중 오류 발생:', backupError);
      return [];
    }
  }
}

/**
 * 특정 날짜 범위의 세션 데이터를 가져옵니다.
 */
export async function getSessionsByDateRange(startDate: Date, endDate: Date): Promise<SessionData[]> {
  try {
    const db = await getDB();
    const sessions = await db.getAll('sessions');
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  } catch (error) {
    console.error('IndexedDB에서 날짜 범위 세션 데이터를 가져오는 중 오류 발생:', error);
    // 실패 시 LocalStorage에서 가져오기
    try {
      const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
      return sessionHistory.filter((session: SessionData) => {
        const sessionDate = new Date(session.date);
        return sessionDate >= startDate && sessionDate <= endDate;
      });
    } catch (backupError) {
      console.error('LocalStorage에서 데이터를 가져오는 중 오류 발생:', backupError);
      return [];
    }
  }
}

/**
 * 특정 시간대의 세션 데이터를 가져옵니다.
 */
export async function getSessionsByTimeOfDay(hour: number): Promise<SessionData[]> {
  try {
    const db = await getDB();
    const index = db.transaction('sessions').store.index('by-timeOfDay');
    return await index.getAll(hour);
  } catch (error) {
    console.error('IndexedDB에서 시간대별 세션 데이터를 가져오는 중 오류 발생:', error);
    // 실패 시 LocalStorage에서 가져오기
    try {
      const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
      return sessionHistory.filter((session: SessionData) => session.timeOfDay === hour);
    } catch (backupError) {
      console.error('LocalStorage에서 데이터를 가져오는 중 오류 발생:', backupError);
      return [];
    }
  }
}

/**
 * 설정 데이터를 저장합니다.
 */
export async function saveSetting(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    await db.put('settings', { key, value });
    console.log(`설정 '${key}'가 IndexedDB에 저장되었습니다.`);
  } catch (error) {
    console.error('IndexedDB에 설정을 저장하는 중 오류 발생:', error);
    // 실패 시 LocalStorage에 백업
    try {
      localStorage.setItem(`setting_${key}`, JSON.stringify(value));
      console.log(`설정 '${key}'가 LocalStorage에 백업되었습니다.`);
    } catch (backupError) {
      console.error('LocalStorage 백업 중 오류 발생:', backupError);
    }
  }
}

/**
 * 설정 데이터를 가져옵니다.
 */
export async function getSetting(key: string, defaultValue: any = null): Promise<any> {
  try {
    const db = await getDB();
    const setting = await db.get('settings', key);
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error('IndexedDB에서 설정을 가져오는 중 오류 발생:', error);
    // 실패 시 LocalStorage에서 가져오기
    try {
      const settingValue = localStorage.getItem(`setting_${key}`);
      return settingValue ? JSON.parse(settingValue) : defaultValue;
    } catch (backupError) {
      console.error('LocalStorage에서 설정을 가져오는 중 오류 발생:', backupError);
      return defaultValue;
    }
  }
}

/**
 * 데이터베이스를 초기화합니다.
 */
export async function clearDatabase(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('sessions', 'readwrite');
    await tx.store.clear();
    await tx.done;
    
    const settingsTx = db.transaction('settings', 'readwrite');
    await settingsTx.store.clear();
    await settingsTx.done;
    
    console.log('데이터베이스가 초기화되었습니다.');
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류 발생:', error);
  }
  
  // LocalStorage도 함께 초기화
  try {
    localStorage.removeItem('sessionHistory');
    localStorage.removeItem('todayStats');
    localStorage.removeItem('weeklyStats');
    
    // 설정 관련 항목 삭제
    const settingKeys = Object.keys(localStorage).filter(key => key.startsWith('setting_'));
    settingKeys.forEach(key => localStorage.removeItem(key));
    
    console.log('LocalStorage가 초기화되었습니다.');
  } catch (error) {
    console.error('LocalStorage 초기화 중 오류 발생:', error);
  }
} 