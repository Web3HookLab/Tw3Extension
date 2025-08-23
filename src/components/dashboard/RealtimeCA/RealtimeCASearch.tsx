import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '~src/components/ui/input';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import {
  Search,
  X,
  Filter,
  Clock,
  User,
  Hash
} from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import type { CAEvent } from '~src/types/realtime-ca.types';

interface RealtimeCASearchProps {
  events: CAEvent[];
  onSearchResults: (results: CAEvent[]) => void;
}

export function RealtimeCASearch({ events, onSearchResults }: RealtimeCASearchProps) {
  const { t } = useSettings();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'user' | 'token' | 'content'>('all');
  const [isSearching, setIsSearching] = useState(false);

  // 搜索逻辑
  const searchResults = useMemo(() => {
    if (!query.trim() || !events || events.length === 0) {
      return events || [];
    }

    const searchTerm = query.toLowerCase().trim();

    return events.filter(event => {
      // 安全检查：确保事件数据结构正确
      if (!event || !event.data) {
        return false;
      }

      const { user, mentions, tweet } = event.data;

      // 安全检查：确保必要字段存在
      if (!user || !mentions || !tweet) {
        return false;
      }

      try {
        switch (searchType) {
          case 'user':
            return (
              (user.name && user.name.toLowerCase().includes(searchTerm)) ||
              (user.screen_name && user.screen_name.toLowerCase().includes(searchTerm)) ||
              (user.rest_id && user.rest_id.includes(searchTerm))
            );

          case 'token':
            return Array.isArray(mentions) && mentions.some(mention =>
              mention && (
                (mention.symbol && mention.symbol.toLowerCase().includes(searchTerm)) ||
                (mention.name && mention.name.toLowerCase().includes(searchTerm)) ||
                (mention.address && mention.address.toLowerCase().includes(searchTerm))
              )
            );

          case 'content':
            return tweet.content && tweet.content.toLowerCase().includes(searchTerm);

          case 'all':
          default:
            return (
              // 用户信息
              (user.name && user.name.toLowerCase().includes(searchTerm)) ||
              (user.screen_name && user.screen_name.toLowerCase().includes(searchTerm)) ||
              (user.rest_id && user.rest_id.includes(searchTerm)) ||
              // 推文内容
              (tweet.content && tweet.content.toLowerCase().includes(searchTerm)) ||
              // 代币信息
              (Array.isArray(mentions) && mentions.some(mention =>
                mention && (
                  (mention.symbol && mention.symbol.toLowerCase().includes(searchTerm)) ||
                  (mention.name && mention.name.toLowerCase().includes(searchTerm)) ||
                  (mention.address && mention.address.toLowerCase().includes(searchTerm))
                )
              ))
            );
        }
      } catch (error) {
        console.error('Search filter error:', error);
        return false;
      }
    });
  }, [events, query, searchType]);

  // 实时搜索效果
  useEffect(() => {
    try {
      onSearchResults(searchResults || []);
    } catch (error) {
      console.error('Search error:', error);
      onSearchResults([]);
    }
  }, [searchResults, onSearchResults]);

  // 处理搜索（保留手动搜索按钮功能）
  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
  };

  // 清除搜索
  const clearSearch = () => {
    setQuery('');
    setSearchType('all');
    try {
      onSearchResults(events || []);
    } catch (error) {
      console.error('Clear search error:', error);
      onSearchResults([]);
    }
  };
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          {t('realtimeCA.search.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 搜索栏 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('realtimeCA.search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>

          <Button
            size="sm"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? t('realtimeCA.search.searching') : t('realtimeCA.search.searchButton')}
          </Button>

          {query && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 搜索类型选择 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('realtimeCA.search.searchScope')}</span>
          {[
            { value: 'all', label: t('realtimeCA.search.all'), icon: Filter },
            { value: 'user', label: t('realtimeCA.search.user'), icon: User },
            { value: 'token', label: t('realtimeCA.search.token'), icon: Hash },
            { value: 'content', label: t('realtimeCA.search.content'), icon: Clock }
          ].map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={searchType === value ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType(value as any)}
              className="h-7 px-2"
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        {/* 搜索结果统计 */}
        {query && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t('realtimeCA.search.resultsFound')
                .replace('{count}', String(searchResults?.length || 0))
                .replace('{total}', String(events?.length || 0))}
            </span>
            <Badge variant="secondary" className="text-xs">
              {searchType === 'all' ? t('realtimeCA.search.all') :
               searchType === 'user' ? t('realtimeCA.search.user') :
               searchType === 'token' ? t('realtimeCA.search.token') : t('realtimeCA.search.content')}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
