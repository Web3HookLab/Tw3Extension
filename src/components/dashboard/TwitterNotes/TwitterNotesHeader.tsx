import React from 'react';
import { Button } from '~src/components/ui/button';
import { Input } from '~src/components/ui/input';
import { Label } from '~src/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~src/components/ui/collapsible';
import { Checkbox } from '~src/components/ui/checkbox';
import { Search, Filter, X, ChevronDown, RefreshCw } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import { TAG_OPTIONS, TAG_COLOR_MAP } from './constants';
import type { TwitterNotesHeaderProps } from '~src/types/twitter-notes.types';

/**
 * Twitter Notes 头部组件
 * 包含搜索框、标签筛选和刷新按钮
 */
export function TwitterNotesHeader({
  search,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  onRefresh,
  loading
}: TwitterNotesHeaderProps) {
  const { t } = useSettings();

  const handleTagToggle = (tag: string, checked: boolean) => {
    if (checked) {
      onTagFilterChange([...tagFilter, tag]);
    } else {
      onTagFilterChange(tagFilter.filter(t => t !== tag));
    }
  };

  const clearTagFilter = () => {
    onTagFilterChange([]);
  };

  return (
    <div className="space-y-3 p-4 border-b">
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('twitterNotes.searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 标签筛选 */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>{t('twitterNotes.tagFilter')}</span>
              {tagFilter.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {tagFilter.length}
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {tagFilter.length > 0 && (
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t('twitterNotes.selectedTags')}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTagFilter}
                className="h-auto p-1 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                {t('common.clear')}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {TAG_OPTIONS.map(tag => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag}`}
                  checked={tagFilter.includes(tag)}
                  onCheckedChange={(checked) => handleTagToggle(tag, checked as boolean)}
                />
                <Label
                  htmlFor={`tag-${tag}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {tag}
                </Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
