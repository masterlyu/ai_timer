import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Define the form schema with zod
const formSchema = z.object({
  nickname: z
    .string()
    .min(2, { message: "닉네임은 최소 2글자 이상이어야 합니다." })
    .max(20, { message: "닉네임은 최대 20글자까지 가능합니다." }),
  targetStudyTime: z
    .number()
    .min(1, { message: "목표 공부 시간은 최소 1분 이상이어야 합니다." })
    .max(1440, { message: "목표 공부 시간은 최대 24시간(1440분)까지 가능합니다." }),
});

// Define the form data type
type FormData = z.infer<typeof formSchema>;

interface UserInfoFormProps {
  onSubmit: (data: FormData) => void;
}

export function UserInfoForm({ onSubmit }: UserInfoFormProps) {
  // Initialize the form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: "",
      targetStudyTime: 60, // Default to 60 minutes
    },
  });

  // Handle form submission
  const handleSubmit = (data: FormData) => {
    // Save to localStorage
    localStorage.setItem("userInfo", JSON.stringify(data));
    
    // Call the onSubmit callback
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">AI 기반 스마트 공부 타이머</CardTitle>
        <CardDescription className="text-center">
          시작하기 전에 기본 정보를 입력해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>닉네임</FormLabel>
                  <FormControl>
                    <Input placeholder="닉네임을 입력하세요" {...field} />
                  </FormControl>
                  <FormDescription>
                    타이머에서 사용할 닉네임을 입력하세요.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetStudyTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>목표 공부 시간 (분)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="60" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    하루 목표 공부 시간을 분 단위로 입력하세요.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">시작하기</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 