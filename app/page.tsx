"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserInfoForm } from "@/components/UserInfoForm";
import { useUser, UserInfo } from "@/lib/context/UserContext";

export default function Home() {
  const { userInfo, setUserInfo, isUserInfoSet } = useUser();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect to timer page if user info is already set
  useEffect(() => {
    if (isClient && isUserInfoSet) {
      router.push("/timer");
    }
  }, [isClient, isUserInfoSet, router]);

  // Handle form submission
  const handleSubmit = (data: UserInfo) => {
    setUserInfo(data);
    router.push("/timer");
  };

  // Show loading state until client-side rendering is complete
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">AI 기반 스마트 공부 타이머</h1>
        <UserInfoForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
