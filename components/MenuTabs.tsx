"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface MenuTabsProps {
  onTabChange?: (tab: string) => void;
}

export function MenuTabs({ onTabChange }: MenuTabsProps) {
  const [activeTab, setActiveTab] = useState("timer");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <Tabs
          defaultValue="timer"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="timer" className="py-3">
              타이머
            </TabsTrigger>
            <TabsTrigger value="stats" className="py-3">
              통계
            </TabsTrigger>
            <TabsTrigger value="settings" className="py-3">
              설정
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
} 