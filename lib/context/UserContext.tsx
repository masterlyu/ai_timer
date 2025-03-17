"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the user info type
export interface UserInfo {
  nickname: string;
  targetStudyTime: number;
}

// Define the context type
interface UserContextType {
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo) => void;
  isUserInfoSet: boolean;
}

// Create the context with default values
const UserContext = createContext<UserContextType>({
  userInfo: null,
  setUserInfo: () => {},
  isUserInfoSet: false,
});

// Create a provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isUserInfoSet, setIsUserInfoSet] = useState<boolean>(false);

  // Load user info from localStorage on mount
  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      try {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        setUserInfo(parsedUserInfo);
        setIsUserInfoSet(true);
      } catch (error) {
        console.error("Failed to parse user info from localStorage:", error);
      }
    }
  }, []);

  // Update user info
  const handleSetUserInfo = (newUserInfo: UserInfo) => {
    setUserInfo(newUserInfo);
    setIsUserInfoSet(true);
    localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
  };

  return (
    <UserContext.Provider
      value={{
        userInfo,
        setUserInfo: handleSetUserInfo,
        isUserInfoSet,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Create a hook to use the context
export function useUser() {
  return useContext(UserContext);
} 