"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/context/UserContext";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { getSetting, saveSetting } from "@/lib/dbUtils";

export function SettingsView() {
  const { userInfo, setUserInfo } = useUser();
  const [nickname, setNickname] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setNickname(userInfo.nickname);
    }

    // 설정 불러오기
    const loadSettings = async () => {
      try {
        const notificationSetting = await getSetting("notificationsEnabled", true);
        const soundSetting = await getSetting("soundEnabled", true);
        
        setNotificationsEnabled(notificationSetting);
        setSoundEnabled(soundSetting);
      } catch (error) {
        console.error("설정을 불러오는 중 오류 발생:", error);
        
        // 로컬 스토리지에서 불러오기 (백업)
        const storedNotifications = localStorage.getItem("notificationsEnabled");
        const storedSound = localStorage.getItem("soundEnabled");
        
        if (storedNotifications !== null) {
          setNotificationsEnabled(storedNotifications === "true");
        }
        
        if (storedSound !== null) {
          setSoundEnabled(storedSound === "true");
        }
      }
    };
    
    loadSettings();
  }, [userInfo]);

  const handleSaveSettings = async () => {
    if (!userInfo) return;
    
    setIsLoading(true);
    
    try {
      // 닉네임 업데이트
      if (nickname !== userInfo.nickname) {
        const updatedUserInfo = {
          ...userInfo,
          nickname
        };
        setUserInfo(updatedUserInfo);
      }
      
      // 알림 설정 저장
      await saveSetting("notificationsEnabled", notificationsEnabled);
      localStorage.setItem("notificationsEnabled", String(notificationsEnabled));
      
      // 소리 설정 저장
      await saveSetting("soundEnabled", soundEnabled);
      localStorage.setItem("soundEnabled", String(soundEnabled));
      
      alert("설정이 저장되었습니다.");
    } catch (error) {
      console.error("설정 저장 중 오류 발생:", error);
      alert("설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>사용자 설정</CardTitle>
          <CardDescription>
            개인 정보와 앱 사용 환경을 설정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">알림</Label>
              <p className="text-sm text-muted-foreground">
                타이머 완료 시 알림을 받습니다.
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound">소리</Label>
              <p className="text-sm text-muted-foreground">
                타이머 완료 시 소리를 재생합니다.
              </p>
            </div>
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
            로그아웃
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            설정 저장
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
        </CardHeader>
        <CardContent>
          {userInfo && (
            <div className="space-y-2">
              <p><strong>이메일:</strong> {userInfo.email || "설정되지 않음"}</p>
              <p><strong>로그인 방식:</strong> {userInfo.provider || "로컬"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 