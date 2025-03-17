"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

// Define the user info type
export interface UserInfo {
  id: string;
  nickname: string;
  email?: string;
  profileImage?: string;
  provider?: string;
}

// Define the context type
interface UserContextType {
  userInfo: UserInfo | null;
  isUserInfoSet: boolean;
  setUserInfo: (info: UserInfo) => void;
  clearUserInfo: () => void;
}

// Create the context with default values
const UserContext = createContext<UserContextType>({
  userInfo: null,
  isUserInfoSet: false,
  setUserInfo: () => {},
  clearUserInfo: () => {},
});

// Create a provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);
  const [isUserInfoSet, setIsUserInfoSet] = useState(false);

  // Load user info from localStorage on mount
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Extract user info from session
      const { name, email, image, provider } = session.user;
      
      // Check existing user info in localStorage
      const storedUserInfo = localStorage.getItem("userInfo");
      let nickname = name || "사용자";
      
      // If existing user info is found, keep the nickname
      if (storedUserInfo) {
        try {
          const parsedInfo = JSON.parse(storedUserInfo);
          if (parsedInfo.email === email) {
            nickname = parsedInfo.nickname;
          }
        } catch (error) {
          console.error("사용자 정보 파싱 오류:", error);
        }
      }
      
      // Set user info
      const newUserInfo: UserInfo = {
        id: email || `${provider}-user-${Date.now()}`,
        nickname,
        email: email || undefined,
        profileImage: image || undefined,
        provider: provider || undefined,
      };
      
      setUserInfoState(newUserInfo);
      setIsUserInfoSet(true);
      
      // Save user info to localStorage
      localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
    } else if (status === "unauthenticated") {
      // Check existing user info in localStorage
      const storedUserInfo = localStorage.getItem("userInfo");
      
      if (storedUserInfo) {
        try {
          const parsedInfo = JSON.parse(storedUserInfo);
          setUserInfoState(parsedInfo);
          setIsUserInfoSet(true);
        } catch (error) {
          console.error("사용자 정보 파싱 오류:", error);
          clearUserInfo();
        }
      } else {
        clearUserInfo();
      }
    }
  }, [session, status]);

  // Update user info
  const setUserInfo = (info: UserInfo) => {
    setUserInfoState(info);
    setIsUserInfoSet(true);
    localStorage.setItem("userInfo", JSON.stringify(info));
  };

  // Clear user info
  const clearUserInfo = () => {
    setUserInfoState(null);
    setIsUserInfoSet(false);
    localStorage.removeItem("userInfo");
  };

  return (
    <UserContext.Provider
      value={{
        userInfo,
        isUserInfoSet,
        setUserInfo,
        clearUserInfo,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Create a hook to use the context
export const useUser = () => useContext(UserContext); 