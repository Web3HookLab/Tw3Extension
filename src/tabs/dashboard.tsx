import React, { useState, useEffect } from "react";
import { SettingsProvider, useSettings } from "~src/contexts/SettingsContext";
import { ThemeProvider } from "~src/contexts/ThemeContext";
import { useAuth } from "~src/services/auth.service";
import {
  TrendingUp,
  Twitter,
  Wallet,
  Settings,
  User,
  LogOut,
  Calendar,
  Zap,
  Bell,
  Info,
  Activity,
  ChevronRight,
  Search,
  Trash2
} from 'lucide-react';
import { Separator } from "~src/components/ui/separator";
import { Badge } from "~src/components/ui/badge";
import ServerStatusBadge from "~src/components/ui/ServerStatusBadge";
import { Avatar, AvatarFallback } from "~src/components/ui/avatar";
import { Card, CardContent } from "~src/components/ui/card";
import { Button } from "~src/components/ui/button";
import LogoutConfirmationDialog from "~src/components/ui/logout-confirmation-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from "~src/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~src/components/ui/collapsible";
import { SettingsModule } from "~src/components/dashboard/settings";
import "~src/styles/style.css"
import { TwitterTrendsModule } from "~src/components/dashboard/TwitterTrends";
import { WalletNotesModule } from "~src/components/dashboard/WalletNotes/WalletNotesModule";
import { TwitterNotesModule } from "~src/components/dashboard/TwitterNotes/TwitterNotesModule";
import { AboutModule } from "~src/components/dashboard/AboutModule";
import { RealtimeCAModule } from "~src/components/dashboard/RealtimeCA";
import { CALeaderboardModule } from "~src/components/dashboard/CALeaderboard/CALeaderboardModule";
import { DeletedTweetsLeaderboardModule } from "~src/components/dashboard/DeletedTweetsLeaderboard/DeletedTweetsLeaderboardModule";
import { CAAddressSearchModule } from "~src/components/dashboard/CAAddressSearch";
import { Toaster } from "sonner";
// 模块枚举
enum DashboardModule {
    REALTIME_CA = 'realtime-ca',
    CA_LEADERBOARD = 'ca-leaderboard',
    DELETED_TWEETS_LEADERBOARD = 'deleted-tweets-leaderboard',
    WEB3_TRENDS = 'web3-trends',
    CA_ADDRESS_SEARCH = 'ca-address-search',
    TWITTER_NOTES = 'twitter-notes',
    WALLET_NOTES = 'wallet-notes',
    SETTINGS = 'settings',
    ABOUT = 'about'
}
function DashboardPage() {
    const [activeModule, setActiveModule] = useState<DashboardModule>(DashboardModule.REALTIME_CA);
    const { t } = useSettings();
    const { userInfo, logout } = useAuth();

    // 调试日志：页面切换
    useEffect(() => {
        console.log('🔄 Dashboard active module changed:', activeModule);
    }, [activeModule]);

    // 侧边栏菜单项 - 重构为分组结构
    const menuGroups = [
        {
            title: t('dashboard.analytics'),
            items: [
                {
                    id: DashboardModule.REALTIME_CA,
                    label: t('realtimeCA.title'),
                    icon: Activity,
                    description: t('realtimeCA.description')
                },
                {
                    id: DashboardModule.CA_LEADERBOARD,
                    label: t('caLeaderboard.title'),
                    icon: TrendingUp,
                    description: t('caLeaderboard.description')
                },
                {
                    id: DashboardModule.DELETED_TWEETS_LEADERBOARD,
                    label: t('deletedTweetsLeaderboard.title'),
                    icon: Trash2,
                    description: t('deletedTweetsLeaderboard.description')
                },
                {
                    id: DashboardModule.WEB3_TRENDS,
                    label: t('dashboard.web3Trends'),
                    icon: TrendingUp,
                    description: t('dashboard.web3TrendsDesc')
                },
                {
                    id: DashboardModule.CA_ADDRESS_SEARCH,
                    label: t('addressSearch.title'),
                    icon: Search,
                    description: t('addressSearch.description')
                }
            ]
        },
        {
            title: t('dashboard.dataManagement'),
            items: [
                {
                    id: DashboardModule.TWITTER_NOTES,
                    label: t('dashboard.twitterNotes'),
                    icon: Twitter,
                    description: t('dashboard.twitterNotesDesc')
                },
                {
                    id: DashboardModule.WALLET_NOTES,
                    label: t('dashboard.walletNotes'),
                    icon: Wallet,
                    description: t('dashboard.walletNotesDesc')
                }
            ]
        },
        {
            title: t('dashboard.system'),
            items: [
                {
                    id: DashboardModule.SETTINGS,
                    label: t('dashboard.settings'),
                    icon: Settings,
                    description: t('dashboard.settingsDesc')
                },
                {
                    id: DashboardModule.ABOUT,
                    label: t('dashboard.about'),
                    icon: Info,
                    description: t('dashboard.aboutDesc')
                }
            ]
        }
    ];

    // 处理登出
    const handleLogout = async () => {
        await logout();
        window.close();
    };

    // 渲染当前模块
    // 修复渲染函数，添加默认内容或临时占位符
    const renderCurrentModule = () => {
        switch (activeModule) {
            case DashboardModule.REALTIME_CA:
                return <RealtimeCAModule isPageActive={true} />
            case DashboardModule.CA_LEADERBOARD:
                return <CALeaderboardModule/>
            case DashboardModule.DELETED_TWEETS_LEADERBOARD:
                return <DeletedTweetsLeaderboardModule/>
            case DashboardModule.WEB3_TRENDS:
                return <TwitterTrendsModule/>
            case DashboardModule.CA_ADDRESS_SEARCH:
                return <CAAddressSearchModule/>
            case DashboardModule.TWITTER_NOTES:
                return <TwitterNotesModule/>
            case DashboardModule.WALLET_NOTES:
                return <WalletNotesModule/>
            case DashboardModule.SETTINGS:
                return <SettingsModule />;
            case DashboardModule.ABOUT:
                return <AboutModule />;
            default:
                return (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">请选择一个模块</p>
                    </div>
                );
        }
    };

    // 获取当前模块信息
    const getCurrentModuleInfo = () => {
        for (const group of menuGroups) {
            const item = group.items.find(item => item.id === activeModule);
            if (item) return item;
        }
        return null;
    };

    const currentModule = getCurrentModuleInfo();

    return (
        <>
            <SidebarProvider>
                <Sidebar collapsible="icon" className="border-r">
                    <SidebarHeader>
                        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-data-[collapsible=icon]:bg-transparent">
                                <img
                                    src={chrome.runtime.getURL("assets/icon.png")}
                                    alt="Extension Icon"
                                    className="w-6 h-6 rounded object-cover group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
                                />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-semibold">{t('dashboard.title')}</span>
                                <span className="truncate text-xs text-muted-foreground">{t('dashboard.subtitle')}</span>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        {/* 用户信息卡片 - 在收起状态下隐藏 */}
                        {userInfo && (
                            <div className="group-data-[collapsible=icon]:hidden">
                                <SidebarGroup>
                                    <div className="px-2">
                                        <Card className="w-full">
                                            <CardContent className="p-3">
                                                {/* 用户基本信息 */}
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>
                                                            <User className="w-4 h-4" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{userInfo.user_id}</p>
                                                        <div className="flex items-center space-x-2">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {userInfo.plan}
                                                            </Badge>
                                                            <ServerStatusBadge
                                                                showText={false}
                                                                size="sm"
                                                                enableUserStatusRefresh={true}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 默认显示的核心信息 */}
                                                <div className="space-y-2">
                                                    {/* 已使用 */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="flex items-center">
                                                                <Zap className="w-3 h-3 mr-1" />
                                                                {t('userInfo.used')}
                                                            </span>
                                                            <span className="font-medium">{userInfo.used} / {userInfo.limit}</span>
                                                        </div>
                                                        <div className="w-full bg-muted rounded-full h-1.5">
                                                            <div
                                                                className="bg-primary h-1.5 rounded-full transition-all"
                                                                style={{ width: `${Math.min((userInfo.used / userInfo.limit) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* 日期信息 */}
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="flex items-center text-muted-foreground">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {t('userInfo.expiryDate')}
                                                            </span>
                                                            <span className="font-medium">{new Date(userInfo.expiry_date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">{t('userInfo.nextResetDate')}</span>
                                                            <span className="font-medium">{new Date(userInfo.next_reset_date).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 可折叠的详细信息 */}
                                                <Collapsible defaultOpen={false} className="group/collapsible mt-3">
                                                    <CollapsibleTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full justify-between h-6 px-0 text-xs text-muted-foreground hover:text-foreground"
                                                        >
                                                            <span>{t('userInfo.details')}</span>
                                                            <ChevronRight className="w-3 h-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="pt-2 space-y-2">
                                                            <Separator />

                                                            {/* 账户功能状态 */}
                                                            <div className="space-y-2 text-xs">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-1">
                                                                        <Twitter className="w-3 h-3" />
                                                                        <span>{t('userInfo.twitterNotes')}</span>
                                                                    </div>
                                                                    <span className="font-medium">{userInfo.twitter_notes_count}/{userInfo.max_twitter_accounts}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-1">
                                                                        <Wallet className="w-3 h-3" />
                                                                        <span>{t('userInfo.walletNotes')}</span>
                                                                    </div>
                                                                    <span className="font-medium">{userInfo.wallet_notes_count}/{userInfo.max_wallet_addresses}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-1">
                                                                        <TrendingUp className="w-3 h-3" />
                                                                        <span>{t('userInfo.followTrends')}</span>
                                                                    </div>
                                                                    <span className={userInfo.follow_trends ? "text-green-600" : "text-muted-foreground"}>
                                                                        {userInfo.follow_trends ? "✓" : "✗"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-1">
                                                                        <Bell className="w-3 h-3" />
                                                                        <span>{t('userInfo.deletionReminder')}</span>
                                                                    </div>
                                                                    <span className={userInfo.deletion_reminder ? "text-green-600" : "text-muted-foreground"}>
                                                                        {userInfo.deletion_reminder ? "✓" : "✗"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </SidebarGroup>
                            </div>
                        )}

                        {/* 导航菜单组 */}
                        {menuGroups.map((group, groupIndex) => (
                            <SidebarGroup key={groupIndex}>
                                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                                <SidebarMenu>
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <SidebarMenuItem key={item.id}>
                                                <SidebarMenuButton
                                                    onClick={() => setActiveModule(item.id)}
                                                    isActive={activeModule === item.id}
                                                    tooltip={item.label}
                                                    className="group-data-[collapsible=icon]:justify-center"
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroup>
                        ))}
                    </SidebarContent>

                    <SidebarFooter>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <LogoutConfirmationDialog onConfirm={handleLogout}>
                                    <SidebarMenuButton
                                        size="lg"
                                        tooltip={t('common.logout')}
                                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="group-data-[collapsible=icon]:hidden">{t('common.logout')}</span>
                                    </SidebarMenuButton>
                                </LogoutConfirmationDialog>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>

                <SidebarInset>
                    {/* 顶部标题栏 */}
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <div className="flex items-center space-x-3">
                                {currentModule && (
                                    <>
                                        <currentModule.icon className="w-5 h-5" />
                                        <div>
                                            <h1 className="font-semibold">{currentModule.label}</h1>
                                            <p className="text-xs text-muted-foreground">{currentModule.description}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* 主内容 */}
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        {renderCurrentModule()}
                    </div>
                </SidebarInset>
            </SidebarProvider>
            <Toaster />
        </>
    );
}

function DashboardPageWithProviders() {
    return (
        <SettingsProvider>
            <ThemeProvider defaultTheme="system" storageKey="app-theme">
                <DashboardPage />
            </ThemeProvider>
        </SettingsProvider>
    );
}

// 修复导出语句
export default DashboardPageWithProviders;