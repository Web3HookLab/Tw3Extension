import React, { useState, useEffect } from 'react';
import { Button } from '~src/components/ui/button';
import { Input } from '~src/components/ui/input';
import { Label } from '~src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~src/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '~src/components/ui/sheet';
import { Badge } from '~src/components/ui/badge';
import { Separator } from '~src/components/ui/separator';
import { Switch } from '~src/components/ui/switch';
import { Filter, X, Save, RotateCcw } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';

// 完全符合WebSocket API规范的过滤器配置 (snake_case)
interface FilterConfig {
  network: 'solana' | 'ethereum';
  minFollowers: number;
  filters: {
    contract_addresses: string[];
    keywords: string[];
    rest_id_blacklist: string[];
    mention_filters: {
      min_total_mentions: number;
      max_total_mentions: number;
      min_unique_users: number;
      max_unique_users: number;
      min_last_5_min: number;
      min_last_20_min: number;
      min_last_30_min: number;
      min_last_1_hour: number;
    };
    user_quality_filters: {
      max_name_changes: number;
      max_screen_name_changes: number;
      min_first_mention_followers: number;
      min_last_mention_followers: number;
      require_user_description: boolean;
    };
    ca_event_filters: {
      min_pump_launch_count: number;
      max_pump_launch_count: number;
      min_pump_migrate_count: number;
      max_pump_migrate_count: number;
      min_raydium_launch_count: number;
      max_raydium_launch_count: number;
      min_raydium_migrate_count: number;
      max_raydium_migrate_count: number;
      min_total_ca_launches: number;
      min_total_ca_migrates: number;
    };
    ca_history_filters: {
      min_today_count: number;
      max_today_count: number;
      max_today_deleted: number;
      min_last_7_days_count: number;
      max_last_7_days_count: number;
      min_last_30_days_count: number;
      max_last_30_days_count: number;
      min_total_count: number;
      max_total_count: number;
    };
    token_quality_filters: {
      require_description: boolean;
      require_image: boolean;
      require_twitter: boolean;
      require_website: boolean;
    };
  };
}

interface RealtimeCAFiltersProps {
  onFiltersChange?: (filters: FilterConfig) => void;
  isConnected?: boolean;
  initialFilters?: FilterConfig; // 从主模块传入的初始过滤器
}

const DEFAULT_FILTERS: FilterConfig = {
  network: 'solana',
  minFollowers: 100,
  filters: {
    contract_addresses: [],
    keywords: [],
    rest_id_blacklist: [],
    mention_filters: {
      min_total_mentions: 0,
      max_total_mentions: 0,
      min_unique_users: 0,
      max_unique_users: 0,
      min_last_5_min: 0,
      min_last_20_min: 0,
      min_last_30_min: 0,
      min_last_1_hour: 0,
    },
    user_quality_filters: {
      max_name_changes: 15,
      max_screen_name_changes: 15,
      min_first_mention_followers: 0,
      min_last_mention_followers: 0,
      require_user_description: false,
    },
    ca_event_filters: {
      min_pump_launch_count: 0,
      max_pump_launch_count: 0,
      min_pump_migrate_count: 0,
      max_pump_migrate_count: 0,
      min_raydium_launch_count: 0,
      max_raydium_launch_count: 0,
      min_raydium_migrate_count: 0,
      max_raydium_migrate_count: 0,
      min_total_ca_launches: 0,
      min_total_ca_migrates: 0,
    },
    ca_history_filters: {
      min_today_count: 0,
      max_today_count: 0,
      max_today_deleted: 0,
      min_last_7_days_count: 0,
      max_last_7_days_count: 0,
      min_last_30_days_count: 0,
      max_last_30_days_count: 0,
      min_total_count: 0,
      max_total_count: 0,
    },
    token_quality_filters: {
      require_description: false,
      require_image: false,
      require_twitter: false,
      require_website: false,
    },
  },
};

export function RealtimeCAFilters({ onFiltersChange, isConnected = false, initialFilters }: RealtimeCAFiltersProps) {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>(initialFilters || DEFAULT_FILTERS);
  const [keywordInput, setKeywordInput] = useState('');
  const [contractInput, setContractInput] = useState('');
  const [blacklistInput, setBlacklistInput] = useState('');

  // 当初始过滤器改变时更新本地状态
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  // 应用过滤器（通过回调通知主模块）
  const applyFilters = (newFilters: FilterConfig) => {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
    console.log('✅ Filters applied:', newFilters);
  };

  // 重置过滤器
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setKeywordInput('');
    setContractInput('');
    setBlacklistInput('');
  };

  // 添加关键词
  const addKeyword = () => {
    if (keywordInput.trim()) {
      const newKeywords = [...filters.filters.keywords, keywordInput.trim()];
      setFilters({
        ...filters,
        filters: {
          ...filters.filters,
          keywords: newKeywords
        }
      });
      setKeywordInput('');
    }
  };

  // 移除关键词
  const removeKeyword = (keyword: string) => {
    const newKeywords = filters.filters.keywords.filter(k => k !== keyword);
    setFilters({
      ...filters,
      filters: {
        ...filters.filters,
        keywords: newKeywords
      }
    });
  };

  // 添加合约地址
  const addContract = () => {
    if (contractInput.trim()) {
      const newContracts = [...filters.filters.contract_addresses, contractInput.trim()];
      setFilters({
        ...filters,
        filters: {
          ...filters.filters,
          contract_addresses: newContracts
        }
      });
      setContractInput('');
    }
  };

  // 移除合约地址
  const removeContract = (contract: string) => {
    const newContracts = filters.filters.contract_addresses.filter(c => c !== contract);
    setFilters({
      ...filters,
      filters: {
        ...filters.filters,
        contract_addresses: newContracts
      }
    });
  };

  // 添加黑名单用户
  const addBlacklistUser = () => {
    if (blacklistInput.trim()) {
      const newBlacklist = [...filters.filters.rest_id_blacklist, blacklistInput.trim()];
      setFilters({
        ...filters,
        filters: {
          ...filters.filters,
          rest_id_blacklist: newBlacklist
        }
      });
      setBlacklistInput('');
    }
  };

  // 移除黑名单用户
  const removeBlacklistUser = (user: string) => {
    const newBlacklist = filters.filters.rest_id_blacklist.filter(u => u !== user);
    setFilters({
      ...filters,
      filters: {
        ...filters.filters,
        rest_id_blacklist: newBlacklist
      }
    });
  };

  // 应用过滤器到主模块
  const handleApplyFilters = () => {
    applyFilters(filters);
    setOpen(false);
  };

  // 计算活跃过滤器数量
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.network !== 'solana') {
      count++;
    } // 默认是solana，如果不是则算作活跃过滤器
    if (filters.minFollowers > 100) {
      count++;
    }
    if (filters.filters?.keywords?.length > 0) {
      count++;
    }
    if (filters.filters?.contract_addresses?.length > 0) {
      count++;
    }
    if (filters.filters?.rest_id_blacklist?.length > 0) {
      count++;
    }
    return count;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2">
          <Filter className="h-3 w-3 mr-1" />
          {t('realtimeCA.controls.filters')}
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs px-1">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('realtimeCA.filters.title')}</SheetTitle>
          <SheetDescription>
            {t('realtimeCA.filters.description')}{isConnected && t('realtimeCA.filters.connectedWarning')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* 基础配置 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t('realtimeCA.filters.basicConfig')}</Label>

            {/* 网络选择 */}
            <div className="space-y-2">
              <Label>{t('realtimeCA.filters.network')}</Label>
              <Select
                value={filters.network}
                onValueChange={(value: 'solana' | 'ethereum') =>
                  setFilters({ ...filters, network: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 最小粉丝数 */}
            <div className="space-y-2">
              <Label>{t('realtimeCA.filters.minFollowers')}</Label>
              <Input
                type="number"
                placeholder="100"
                min="100"
                value={filters.minFollowers}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  minFollowers: Math.max(100, parseInt(e.target.value) || 100)
                })}
              />
            </div>
          </div>

          {/* 关键词过滤 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t('realtimeCA.filters.contentFilter')}</Label>

            <div className="space-y-2">
              <Label>{t('realtimeCA.filters.keywords')}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t('realtimeCA.filters.keywordsPlaceholder')}
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button size="sm" onClick={addKeyword}>{t('realtimeCA.filters.add')}</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {filters.filters.keywords.map(keyword => (
                  <div key={keyword} className="flex items-center">
                    <Badge variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeKeyword(keyword)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('realtimeCA.filters.contractAddresses')}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t('realtimeCA.filters.contractPlaceholder')}
                  value={contractInput}
                  onChange={(e) => setContractInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addContract()}
                />
                <Button size="sm" onClick={addContract}>{t('realtimeCA.filters.add')}</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {filters.filters.contract_addresses.map(contract => (
                  <div key={contract} className="flex items-center">
                    <Badge variant="secondary" className="text-xs">
                      {contract.substring(0, 8)}...{contract.substring(contract.length - 6)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeContract(contract)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('realtimeCA.filters.blacklist')}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t('realtimeCA.filters.blacklistPlaceholder')}
                  value={blacklistInput}
                  onChange={(e) => setBlacklistInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addBlacklistUser()}
                />
                <Button size="sm" onClick={addBlacklistUser}>{t('realtimeCA.filters.add')}</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {filters.filters.rest_id_blacklist.map(user => (
                  <div key={user} className="flex items-center">
                    <Badge variant="outline" className="text-xs">
                      {user}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeBlacklistUser(user)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* 代币提及过滤器 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t('realtimeCA.filters.tokenMentionFilter')}</Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{t('realtimeCA.filters.minTotalMentions')}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.filters.mention_filters.min_total_mentions}
                  onChange={(e) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      mention_filters: {
                        ...filters.filters.mention_filters,
                        min_total_mentions: parseInt(e.target.value) || 0
                      }
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{t('realtimeCA.filters.minUniqueUsers')}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.filters.mention_filters.min_unique_users}
                  onChange={(e) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      mention_filters: {
                        ...filters.filters.mention_filters,
                        min_unique_users: parseInt(e.target.value) || 0
                      }
                    }
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{t('realtimeCA.filters.recent5MinMentions')}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.filters.mention_filters.min_last_5_min}
                  onChange={(e) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      mention_filters: {
                        ...filters.filters.mention_filters,
                        min_last_5_min: parseInt(e.target.value) || 0
                      }
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{t('realtimeCA.filters.recent1HourMentions')}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.filters.mention_filters.min_last_1_hour}
                  onChange={(e) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      mention_filters: {
                        ...filters.filters.mention_filters,
                        min_last_1_hour: parseInt(e.target.value) || 0
                      }
                    }
                  })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 用户质量过滤器 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t('realtimeCA.filters.userQualityFilter')}</Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{t('realtimeCA.filters.maxUsernameChanges')}</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={filters.filters.user_quality_filters.max_name_changes}
                  onChange={(e) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      user_quality_filters: {
                        ...filters.filters.user_quality_filters,
                        max_name_changes: parseInt(e.target.value) || 15
                      }
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{t('realtimeCA.filters.maxNameChanges')}</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={filters.filters.user_quality_filters.max_screen_name_changes}
                  onChange={(e) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      user_quality_filters: {
                        ...filters.filters.user_quality_filters,
                        max_screen_name_changes: parseInt(e.target.value) || 15
                      }
                    }
                  })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="require-description"
                checked={filters.filters.user_quality_filters.require_user_description}
                onCheckedChange={(checked) => setFilters({
                  ...filters,
                  filters: {
                    ...filters.filters,
                    user_quality_filters: {
                      ...filters.filters.user_quality_filters,
                      require_user_description: checked
                    }
                  }
                })}
              />
              <Label htmlFor="require-description">{t('realtimeCA.filters.requireDescription')}</Label>
            </div>
          </div>

          <Separator />

          {/* 代币质量过滤器 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t('realtimeCA.filters.tokenQualityFilter')}</Label>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="require-token-description"
                  checked={filters.filters.token_quality_filters.require_description}
                  onCheckedChange={(checked) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      token_quality_filters: {
                        ...filters.filters.token_quality_filters,
                        require_description: checked
                      }
                    }
                  })}
                />
                <Label htmlFor="require-token-description">{t('realtimeCA.filters.requireTokenDescription')}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="require-token-image"
                  checked={filters.filters.token_quality_filters.require_image}
                  onCheckedChange={(checked) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      token_quality_filters: {
                        ...filters.filters.token_quality_filters,
                        require_image: checked
                      }
                    }
                  })}
                />
                <Label htmlFor="require-token-image">{t('realtimeCA.filters.requireTokenImage')}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="require-token-twitter"
                  checked={filters.filters.token_quality_filters.require_twitter}
                  onCheckedChange={(checked) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      token_quality_filters: {
                        ...filters.filters.token_quality_filters,
                        require_twitter: checked
                      }
                    }
                  })}
                />
                <Label htmlFor="require-token-twitter">{t('realtimeCA.filters.requireTokenTwitter')}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="require-token-website"
                  checked={filters.filters.token_quality_filters.require_website}
                  onCheckedChange={(checked) => setFilters({
                    ...filters,
                    filters: {
                      ...filters.filters,
                      token_quality_filters: {
                        ...filters.filters.token_quality_filters,
                        require_website: checked
                      }
                    }
                  })}
                />
                <Label htmlFor="require-token-website">{t('realtimeCA.filters.requireTokenWebsite')}</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* 操作按钮 */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('realtimeCA.filters.reset')}
            </Button>
            <Button onClick={handleApplyFilters}>
              <Save className="h-4 w-4 mr-2" />
              {t('realtimeCA.filters.saveAndApply')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
