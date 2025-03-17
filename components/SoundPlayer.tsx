"use client";

import { useEffect, useRef } from "react";

interface SoundPlayerProps {
  soundUrl: string;
  play: boolean;
  volume?: number;
  loop?: boolean;
  onEnded?: () => void;
}

export function SoundPlayer({
  soundUrl,
  play,
  volume = 0.5,
  loop = false,
  onEnded
}: SoundPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 오디오 요소 생성
    if (!audioRef.current) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
      
      if (onEnded) {
        audioRef.current.addEventListener("ended", onEnded);
      }
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (onEnded) {
          audioRef.current.removeEventListener("ended", onEnded);
        }
        audioRef.current = null;
      }
    };
  }, [soundUrl, volume, loop, onEnded]);

  // play 상태에 따라 오디오 재생/정지
  useEffect(() => {
    if (!audioRef.current) return;

    if (play) {
      // 브라우저 정책으로 인해 사용자 상호작용 없이 자동 재생이 차단될 수 있음
      // 이 경우 catch 블록에서 처리
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("자동 재생이 차단되었습니다:", error);
        });
      }
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [play]);

  // 볼륨 변경
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 루프 설정 변경
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
} 