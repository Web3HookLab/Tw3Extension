import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from "~src/services/auth.service";
import { Storage } from '@plasmohq/storage';
import { API_CONFIG } from '~src/config/config';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { TrendingUp } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import { TokenManager } from "~src/services/token.service";
import { TwitterTrendsControls } from './TwitterTrendsControls';
import { TwitterTrendsList } from './TwitterTrendsList';
import { TwitterFollowersDialog } from './TwitterFollowersDialog';
import { generateDataHash, openTwitterProfile } from './utils';
import type {
  TwitterTrendItem,
  TwitterFollower,
  TwitterTrendsResponse,
  UserPreferences
} from '~src/types/twitter-trends.types';

const storage = new Storage({ area: 'local' });

export function TwitterTrendsModule() {
  const { t } = useSettings();
  const { userInfo } = useAuth();
  const { trendsCount, autoRefreshInterval } = useSettings();
  
  // 状态管理
  const [trends, setTrends] = useState<TwitterTrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    timeUnit: 'hour',
    timeValue: 1
  });
  
  // 缓存上一次成功的数据，用于429错误时使用
  const [cachedData, setCachedData] = useState<TwitterTrendItem[]>([]);
  // 缓存上一次的数据哈希，用于比较是否需要重新渲染
  const [lastDataHash, setLastDataHash] = useState<string>('initial');
  // 记录上次更新时间，避免频繁更新
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  
  // 刷新控制状态
  const [isPaused, setIsPaused] = useState(false);
  
  // 显示所有关注者的Dialog状态
  const [showAllFollowers, setShowAllFollowers] = useState(false);
  const [selectedTrendFollowers, setSelectedTrendFollowers] = useState<TwitterFollower[]>([]);
  const [selectedTrendName, setSelectedTrendName] = useState('');
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [showAll, setShowAll] = useState(false);

  // 检查用户权限
  const canAccess = userInfo && userInfo.plan !== 'Free';

  // 加载用户偏好设置
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const saved = await storage.get('twitter_trends_preferences') as UserPreferences;
        if (saved) {
          setPreferences(saved);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // 保存用户偏好设置
  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      await storage.set('twitter_trends_preferences', newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  // 获取Twitter趋势数据
  const fetchTrends = useCallback(async () => {
    if (!canAccess) return;

    try {
      setLoading(true);
      setError(null);

      const token = await TokenManager.getToken();
      if (!token) {
        throw new Error('No valid token available');
      }

      // 构建正确的请求体格式
      const requestBody = {
        time_unit: preferences.timeUnit,
        ...(preferences.timeUnit === 'hour' 
          ? { hours: preferences.timeValue }
          : { minutes: preferences.timeValue }
        ),
        pagination: {
          limit: 50,
          offset: 0
        }
      };

      console.log('🚀 API Request:', {
        url: `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_TRENDS}`,
        body: requestBody
      });

      const response = await fetch(`${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_TRENDS}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Tw3Track-Extension/1.0'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 429) {
        // 429错误时使用缓存数据，不显示错误
        if (Array.isArray(cachedData) && cachedData.length > 0) {
          const cachedHash = generateDataHash(cachedData);
          if (cachedHash !== lastDataHash) {
            setTrends(cachedData);
            setLastDataHash(cachedHash);
            console.log('📝 Using cached data due to 429 error');
          } else {
            console.log('🔄 Cached data unchanged, skipping render');
          }
        }
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || `HTTP ${response.status}`);
      }

      const data: TwitterTrendsResponse = await response.json();
      
      if (data.code !== 200) {
        throw new Error(data.msg || 'API returned error');
      }

      const newTrends = Array.isArray(data.data?.data) ? data.data.data : [];
      
      const newHash = generateDataHash(newTrends);
      
      const currentTime = Date.now();
      const timeSinceLastUpdate = currentTime - lastUpdateTime;
      const minUpdateInterval = 30000; // 最少30秒间隔，平衡更新频率和性能
      
      console.log('🔍 Hash comparison:', {
        newHash: newHash.substring(0, 100) + '...',
        lastDataHash: lastDataHash.substring(0, 100) + '...',
        dataLength: newTrends.length,
        isEqual: newHash === lastDataHash,
        timeSinceLastUpdate: Math.round(timeSinceLastUpdate / 1000) + 's',
        shouldUpdate: newHash !== lastDataHash || timeSinceLastUpdate > minUpdateInterval
      });
      
      // 数据变化或超过最小更新间隔时才更新
      if (newHash !== lastDataHash || timeSinceLastUpdate > minUpdateInterval) {
        setTrends(newTrends);
        setCachedData(newTrends);
        setLastDataHash(newHash);
        setLastUpdateTime(currentTime);
        console.log('📝 Data updated:', newTrends.length, 'items', 
          newHash !== lastDataHash ? '(data changed)' : '(time interval)');
      } else {
        console.log('🔄 Data unchanged, skipping render');
      }
      
    } catch (error) {
      console.error('Failed to fetch Twitter trends:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [canAccess, preferences, cachedData, lastDataHash, lastUpdateTime]);

  // 初始加载和偏好设置变化时重新加载
  useEffect(() => {
    if (canAccess) {
      setTrends([]);
      setLastDataHash('reset'); // 重置哈希，强制更新
      setLastUpdateTime(0); // 重置更新时间
      fetchTrends();
    }
  }, [preferences, canAccess]);

  // 自动刷新机制
  useEffect(() => {
    if (!canAccess) return;
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(() => {
      if (!isPaused) fetchTrends();
    }, autoRefreshInterval * 1000);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [canAccess, fetchTrends, isPaused, autoRefreshInterval]);

  // 手动刷新
  const handleRefresh = () => {
    setLastDataHash('reset'); // 重置哈希，强制更新
    setLastUpdateTime(0); // 重置更新时间
    fetchTrends();
  };

  // 强制刷新（忽略缓存）
  const handleForceRefresh = () => {
    setLastDataHash('force-refresh-' + Date.now()); // 使用时间戳确保唯一性
    setLastUpdateTime(0);
    fetchTrends();
  };

  // 时间单位变化处理
  const handleTimeUnitChange = (unit: 'minute' | 'hour') => {
    const newPreferences: UserPreferences = {
      timeUnit: unit,
      timeValue: unit === 'minute' ? 10 : 1
    };
    savePreferences(newPreferences);
  };

  // 时间值变化处理
  const handleTimeValueChange = (value: string) => {
    const newPreferences: UserPreferences = {
      ...preferences,
      timeValue: parseInt(value)
    };
    savePreferences(newPreferences);
  };



  // 显示所有关注者
  const showAllFollowersDialog = (followers: TwitterFollower[], trendName: string) => {
    setSelectedTrendFollowers(followers);
    setSelectedTrendName(trendName);
    setShowAllFollowers(true);
  };

  // 切换暂停/恢复自动刷新
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 权限检查
  if (!canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('dashboard.upgradeRequired')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {t('dashboard.upgradeRequired')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('dashboard.web3Trends')}
          </CardTitle>

          {/* 控制栏组件 */}
          <TwitterTrendsControls
            preferences={preferences}
            loading={loading}
            isPaused={isPaused}
            onTimeUnitChange={handleTimeUnitChange}
            onTimeValueChange={handleTimeValueChange}
            onTogglePause={togglePause}
            onRefresh={handleRefresh}
            onForceRefresh={handleForceRefresh}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* 趋势列表组件 */}
        <TwitterTrendsList
          trends={trends}
          loading={loading}
          error={error}
          showAll={showAll}
          trendsCount={trendsCount}
          onShowAllToggle={() => setShowAll(v => !v)}
          onOpenTwitterProfile={openTwitterProfile}
          onShowAllFollowers={showAllFollowersDialog}
        />
      </CardContent>

      {/* 关注者详情对话框组件 */}
      <TwitterFollowersDialog
        open={showAllFollowers}
        onOpenChange={setShowAllFollowers}
        followers={selectedTrendFollowers}
        trendName={selectedTrendName}
        onOpenTwitterProfile={openTwitterProfile}
      />
    </Card>
  );
}