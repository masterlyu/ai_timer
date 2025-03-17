"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatTime } from "@/lib/utils";
import { StatsSummary, FeedbackItem, generateStatsSummary, generateFeedback } from "@/lib/statsUtils";
import { AlertCircle, CheckCircle, Info, TrendingUp, TrendingDown, Clock, Calendar, Award, AlertTriangle } from "lucide-react";

export function DetailedStatsView() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  // 통계 및 피드백 로드
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const newStats = await generateStatsSummary(timeRange);
        setStats(newStats);
        
        const newFeedback = await generateFeedback();
        setFeedback(newFeedback);
      } catch (error) {
        console.error("통계 로딩 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, [timeRange]);

  // 시간 범위 변경 핸들러
  const handleTimeRangeChange = (days: 7 | 30 | 90) => {
    setTimeRange(days);
  };

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">통계를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!stats || stats.totalSessions === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">아직 통계 데이터가 없습니다</h3>
            <p className="text-sm text-gray-500 mt-2">
              학습 세션을 완료하면 여기에 통계가 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 시간 범위 선택 */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <Button
            variant={timeRange === 7 ? "default" : "outline"}
            className="rounded-l-md rounded-r-none"
            onClick={() => handleTimeRangeChange(7)}
          >
            최근 7일
          </Button>
          <Button
            variant={timeRange === 30 ? "default" : "outline"}
            className="rounded-none border-x-0"
            onClick={() => handleTimeRangeChange(30)}
          >
            최근 30일
          </Button>
          <Button
            variant={timeRange === 90 ? "default" : "outline"}
            className="rounded-r-md rounded-l-none"
            onClick={() => handleTimeRangeChange(90)}
          >
            최근 90일
          </Button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="details">상세 통계</TabsTrigger>
          <TabsTrigger value="feedback">피드백</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 주요 통계 카드 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">주요 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500">총 학습 시간</span>
                      <span className="font-medium">{formatTime(stats.totalStudyTime)}</span>
                    </div>
                    <Progress value={Math.min(100, (stats.totalStudyTime / 36000) * 100)} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500">평균 집중도</span>
                      <span className="font-medium">{stats.averageFocusRate}%</span>
                    </div>
                    <Progress value={stats.averageFocusRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500">세션 완료율</span>
                      <span className="font-medium">{stats.completionRate}%</span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-500">총 세션 수:</span>
                      <span className="font-medium ml-auto">{stats.totalSessions}회</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-500">평균 세션 시간:</span>
                      <span className="font-medium ml-auto">{formatTime(stats.averageSessionDuration)}</span>
                    </div>
                  </div>
                  
                  {stats.studyStreak > 0 && (
                    <div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-yellow-500" />
                        <span className="text-sm text-gray-500">연속 학습일:</span>
                        <span className="font-medium ml-auto">{stats.studyStreak}일</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 주간 비교 카드 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">지난 주 대비</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    {stats.lastWeekComparison.studyTimeChange > 0 ? (
                      <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    ) : stats.lastWeekComparison.studyTimeChange < 0 ? (
                      <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 mr-2" />
                    )}
                    <span className="text-sm text-gray-500">학습 시간:</span>
                    <span className={`font-medium ml-auto ${
                      stats.lastWeekComparison.studyTimeChange > 0 
                        ? 'text-green-500' 
                        : stats.lastWeekComparison.studyTimeChange < 0 
                          ? 'text-red-500' 
                          : ''
                    }`}>
                      {stats.lastWeekComparison.studyTimeChange > 0 ? '+' : ''}
                      {Math.round(stats.lastWeekComparison.studyTimeChange)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    {stats.lastWeekComparison.focusRateChange > 0 ? (
                      <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    ) : stats.lastWeekComparison.focusRateChange < 0 ? (
                      <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 mr-2" />
                    )}
                    <span className="text-sm text-gray-500">집중도:</span>
                    <span className={`font-medium ml-auto ${
                      stats.lastWeekComparison.focusRateChange > 0 
                        ? 'text-green-500' 
                        : stats.lastWeekComparison.focusRateChange < 0 
                          ? 'text-red-500' 
                          : ''
                    }`}>
                      {stats.lastWeekComparison.focusRateChange > 0 ? '+' : ''}
                      {Math.round(stats.lastWeekComparison.focusRateChange)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    {stats.lastWeekComparison.sessionCountChange > 0 ? (
                      <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    ) : stats.lastWeekComparison.sessionCountChange < 0 ? (
                      <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 mr-2" />
                    )}
                    <span className="text-sm text-gray-500">세션 수:</span>
                    <span className={`font-medium ml-auto ${
                      stats.lastWeekComparison.sessionCountChange > 0 
                        ? 'text-green-500' 
                        : stats.lastWeekComparison.sessionCountChange < 0 
                          ? 'text-red-500' 
                          : ''
                    }`}>
                      {stats.lastWeekComparison.sessionCountChange > 0 ? '+' : ''}
                      {Math.round(stats.lastWeekComparison.sessionCountChange)}%
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium mb-2">최적 학습 패턴</h4>
                    
                    {stats.bestStudyDay && (
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm text-gray-500">최고 집중 요일:</span>
                        <span className="font-medium ml-auto">{stats.bestStudyDay}</span>
                      </div>
                    )}
                    
                    {stats.bestStudyTime && (
                      <div className="flex items-center mb-2">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm text-gray-500">최고 집중 시간대:</span>
                        <span className="font-medium ml-auto">{stats.bestStudyTime}</span>
                      </div>
                    )}
                    
                    {stats.mostProductiveTimeOfDay && (
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm text-gray-500">가장 생산적인 시간대:</span>
                        <span className="font-medium ml-auto">{stats.mostProductiveTimeOfDay}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 상세 통계 탭 */}
        <TabsContent value="details">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">학습 패턴 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">세션 통계</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500">총 세션 수</div>
                        <div className="text-xl font-bold">{stats.totalSessions}회</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500">평균 세션 시간</div>
                        <div className="text-xl font-bold">{formatTime(stats.averageSessionDuration)}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500">총 학습 시간</div>
                        <div className="text-xl font-bold">{formatTime(stats.totalStudyTime)}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500">세션 완료율</div>
                        <div className="text-xl font-bold">{stats.completionRate}%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">집중도 분석</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">평균 집중도</span>
                        <span className="text-xs font-medium">{stats.averageFocusRate}%</span>
                      </div>
                      <Progress 
                        value={stats.averageFocusRate} 
                        className="h-2"
                        style={{
                          background: 'linear-gradient(to right, #ef4444, #eab308, #22c55e)',
                        }}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">낮음</span>
                        <span className="text-xs text-gray-500">높음</span>
                      </div>
                      
                      {/* 집중도 점수 설명 */}
                      {stats.focusRateReason && (
                        <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                          <p className="text-sm text-gray-700">{stats.focusRateReason}</p>
                        </div>
                      )}
                      
                      {/* 집중도 저하 요인 */}
                      {stats.focusIssues && stats.focusIssues.length > 0 && stats.averageFocusRate < 70 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-medium mb-2 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                            집중도 저하 요인
                          </h5>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {stats.focusIssues.map((issue, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mt-1 mr-2"></span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">최적 학습 시간</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.bestStudyDay && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xs text-blue-500">최고 집중 요일</div>
                          <div className="text-xl font-bold">{stats.bestStudyDay}</div>
                        </div>
                      )}
                      
                      {stats.bestStudyTime && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xs text-blue-500">최고 집중 시간대</div>
                          <div className="text-xl font-bold">{stats.bestStudyTime}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {stats.studyStreak > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">학습 연속일</h4>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Award className="h-5 w-5 mr-2 text-yellow-500" />
                          <div>
                            <div className="text-xs text-yellow-500">현재 연속 학습일</div>
                            <div className="text-xl font-bold">{stats.studyStreak}일</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 피드백 탭 */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">맞춤 피드백</CardTitle>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">아직 피드백이 없습니다</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    더 많은 세션을 완료하면 맞춤형 피드백을 제공해드릴 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((item, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border ${
                        item.type === 'positive' 
                          ? 'bg-green-50 border-green-200' 
                          : item.type === 'warning' 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex">
                        {item.type === 'positive' ? (
                          <CheckCircle className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
                        ) : item.type === 'warning' ? (
                          <AlertCircle className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
                        ) : (
                          <Info className="h-5 w-5 mr-3 text-blue-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className={`text-sm ${
                            item.type === 'positive' 
                              ? 'text-green-800' 
                              : item.type === 'warning' 
                                ? 'text-red-800' 
                                : 'text-blue-800'
                          }`}>
                            {item.message}
                          </p>
                          
                          {item.actionable && item.action && (
                            <div className="mt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className={`text-xs ${
                                  item.type === 'positive' 
                                    ? 'border-green-300 text-green-700 hover:bg-green-100' 
                                    : item.type === 'warning' 
                                      ? 'border-red-300 text-red-700 hover:bg-red-100' 
                                      : 'border-blue-300 text-blue-700 hover:bg-blue-100'
                                }`}
                              >
                                {item.action}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 