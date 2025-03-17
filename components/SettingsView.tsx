"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserInfo } from "@/lib/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsView() {
  const { userInfo, setUserInfo } = useUser();
  const router = useRouter();
  
  const [nickname, setNickname] = useState(userInfo?.nickname || "");
  const [targetStudyTime, setTargetStudyTime] = useState(
    userInfo?.targetStudyTime.toString() || "60"
  );

  const handleSave = () => {
    if (userInfo) {
      const updatedUserInfo: UserInfo = {
        ...userInfo,
        nickname,
        targetStudyTime: parseInt(targetStudyTime, 10) || 60,
      };
      setUserInfo(updatedUserInfo);
    }
  };

  const handleReset = () => {
    // 모든 통계 데이터 초기화
    localStorage.removeItem("todayStats");
    localStorage.removeItem("weeklyStats");
    alert("모든 통계 데이터가 초기화되었습니다.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">사용자 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetStudyTime">목표 공부 시간 (분)</Label>
            <Input
              id="targetStudyTime"
              type="number"
              value={targetStudyTime}
              onChange={(e) => setTargetStudyTime(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSave}>
            저장
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">데이터 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleReset}
          >
            통계 데이터 초기화
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 