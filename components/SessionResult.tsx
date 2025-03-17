"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTime } from "@/lib/utils";
import { SessionData } from "@/lib/aiUtils";

interface SessionResultProps {
  session: SessionData;
  onClose: () => void;
  onStartNewSession: () => void;
}

export function SessionResult({ session, onClose, onStartNewSession }: SessionResultProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleStartNewSession = () => {
    setIsOpen(false);
    onStartNewSession();
  };

  // 세션 성과 메시지 생성
  const getPerformanceMessage = () => {
    if (session.focusRate >= 90) {
      return "훌륭해요! 최고의 집중력을 보여주셨습니다.";
    } else if (session.focusRate >= 70) {
      return "좋아요! 대체로 집중을 잘 유지하셨습니다.";
    } else if (session.focusRate >= 50) {
      return "괜찮아요. 다음에는 더 집중해보세요.";
    } else {
      return "집중하기 어려웠나요? 더 짧은 세션으로 시도해보세요.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>세션 완료!</DialogTitle>
          <DialogDescription>
            공부 세션이 완료되었습니다. 수고하셨습니다!
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">세션 결과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">공부 시간</p>
                  <p className="text-lg font-medium">{formatTime(session.duration)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">집중도</p>
                  <div className="flex items-center">
                    <p className="text-lg font-medium">{session.focusRate}%</p>
                    <div className="ml-2 w-12 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${session.focusRate}%`,
                          backgroundColor: session.focusRate > 80 ? '#22c55e' : session.focusRate > 50 ? '#eab308' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm mt-4">{getPerformanceMessage()}</p>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="flex space-x-2 sm:space-x-0">
          <Button variant="outline" onClick={handleClose}>
            닫기
          </Button>
          <Button onClick={handleStartNewSession}>
            새 세션 시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 