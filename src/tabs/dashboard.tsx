import React, { useState } from "react";
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
  ExternalLink,
  Github
} from 'lucide-react';
import { Separator } from "~src/components/ui/separator";
import { Badge } from "~src/components/ui/badge";
import ServerStatusBadge from "~src/components/ui/ServerStatusBadge";
import { Avatar, AvatarFallback } from "~src/components/ui/avatar";
import { Card, CardContent } from "~src/components/ui/card";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "~src/components/ui/sidebar";
import { Button } from "~src/components/ui/button";
import LogoutConfirmationDialog from "~src/components/ui/logout-confirmation-dialog";
import { SettingsModule } from "~src/components/dashboard/settings";
import "~src/styles/style.css"
import { TwitterTrendsModule } from "~src/components/dashboard/TwitterTrends";
import { WalletNotesModule } from "~src/components/dashboard/WalletNotes/WalletNotesModule";
import { TwitterNotesModule } from "~src/components/dashboard/TwitterNotes/TwitterNotesModule";
import { AboutModule } from "~src/components/dashboard/AboutModule";
// 模块枚举
enum DashboardModule {
    WEB3_TRENDS = 'web3-trends',
    TWITTER_NOTES = 'twitter-notes',
    WALLET_NOTES = 'wallet-notes',
    SETTINGS = 'settings',
    ABOUT = 'about'
}
function DashboardPage() {
    const [activeModule, setActiveModule] = useState<DashboardModule>(DashboardModule.WEB3_TRENDS);
    const { t } = useSettings();
    const { userInfo, logout } = useAuth();

    // 侧边栏菜单项
    const menuItems = [
        {
            id: DashboardModule.WEB3_TRENDS,
            label: t('dashboard.web3Trends'),
            icon: TrendingUp,
            description: t('dashboard.web3TrendsDesc')
        },
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
        },
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
            case DashboardModule.WEB3_TRENDS:
                return <TwitterTrendsModule/>
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
        return menuItems.find(item => item.id === activeModule);
    };

    const currentModule = getCurrentModuleInfo();

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
                {/* 侧边栏 */}
                <Sidebar className="border-r">
                    <SidebarHeader className="p-4">
                        <div className="flex items-center space-x-3">
                            <img
                                src={chrome.runtime.getURL("assets/icon.png")}
                                alt="Extension Icon"
                                className="w-8 h-8 rounded-full object-cover border border-border"
                            />
                            <div>
                                <h2 className="font-semibold text-lg">{t('dashboard.title')}</h2>
                                <p className="text-xs text-muted-foreground">{t('dashboard.subtitle')}</p>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        {/* 用户信息卡片 */}
                        {userInfo && (
                            <div className="p-4">
                                <Card className="w-full">
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <Avatar>
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

                                        <Separator className="my-3" />

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
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

                                            <Separator />

                                            {/* 账户日期信息 */}
                                            <div className="space-y-2 text-xs text-muted-foreground">
                                                <div className="flex justify-between">
                                                    <span className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {t('userInfo.expiryDate')}
                                                    </span>
                                                    <span>{new Date(userInfo.expiry_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>{t('userInfo.nextResetDate')}</span>
                                                    <span>{new Date(userInfo.next_reset_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* 导航菜单 */}
                        <SidebarMenu className="px-4">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            onClick={() => setActiveModule(item.id)}
                                            isActive={activeModule === item.id}
                                            className="w-full justify-start"
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>

                        {/* 底部登出按钮 */}
                        <div className="mt-auto p-4">
                            <LogoutConfirmationDialog onConfirm={handleLogout}>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    size="sm"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    {t('common.logout')}
                                </Button>
                            </LogoutConfirmationDialog>
                        </div>
                    </SidebarContent>
                </Sidebar>

                {/* 主内容区域 */}
                <div className="flex-1 flex flex-col">
                    {/* 顶部标题栏 */}
                    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex h-14 items-center px-6">
                            <SidebarTrigger className="mr-4" />
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
                    <main className="flex-1 p-6">
                        {renderCurrentModule()}
                    </main>
                </div>
            </div>
        </SidebarProvider>
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