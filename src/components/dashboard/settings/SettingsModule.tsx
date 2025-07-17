import React, { useState } from 'react';
import { LanguageSettings } from './LanguageSettings';
import { DataManagementSettings } from './DataManagementSettings';
import { DexPlatformSettings } from './DexPlatformSettings';
import { useSettings } from '~src/contexts/SettingsContext';
import { Settings, FileText, Coins } from 'lucide-react';

// 设置标签页枚举
enum SettingsTab {
  GENERAL = 'general',
  DATA_MANAGEMENT = 'data-management',
  DEX_PLATFORMS = 'dex-platforms'
}

/**
 * 设置模块主组件
 * 使用标签页布局整合所有设置子组件
 */
export function SettingsModule() {
  const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.GENERAL);
  const { t } = useSettings();

  // 标签页配置
  const tabs = [
    {
      id: SettingsTab.GENERAL,
      label: t('settings.tabs.general'),
      icon: Settings,
      description: t('settings.tabs.generalDesc')
    },
    {
      id: SettingsTab.DATA_MANAGEMENT,
      label: t('settings.tabs.dataManagement'),
      icon: FileText,
      description: t('settings.tabs.dataManagementDesc')
    },
    {
      id: SettingsTab.DEX_PLATFORMS,
      label: t('settings.tabs.dexPlatforms'),
      icon: Coins,
      description: t('settings.tabs.dexPlatformsDesc')
    }
  ];

  // 渲染当前标签页内容
  const renderTabContent = () => {
    switch (activeTab) {
      case SettingsTab.GENERAL:
        return <LanguageSettings />;
      case SettingsTab.DATA_MANAGEMENT:
        return <DataManagementSettings />;
      case SettingsTab.DEX_PLATFORMS:
        return <DexPlatformSettings />;
      default:
        return <LanguageSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 标签页导航 */}
      <div className="border-b border-border">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`
                  mr-2 h-4 w-4 transition-colors
                  ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                `} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
}