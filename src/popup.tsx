import React, { useEffect, useState } from "react"

import "./styles/style.css"

import {
  Bell,
  Settings,
  TrendingUp,
  Twitter,
  User,
  Wallet,
  Zap
} from "lucide-react"

import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "./components/ui/card"
import LogoutConfirmationDialog from "./components/ui/logout-confirmation-dialog"
import { Separator } from "./components/ui/separator"
import ServerStatusBadge from "./components/ui/ServerStatusBadge"
import { Switch } from "./components/ui/switch"
import { SettingsProvider, useSettings } from "./contexts/SettingsContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { useAuth } from "./services/auth.service"
import { TwitterAutoQueryManager, TwitterKolListManager } from "./services/twitter.service"

function LoginPrompt() {
  const { language, t } = useSettings()

  const handleOpenLogin = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("tabs/login.html") })
  }

  return (
    <div className="flex w-[360px] h-[600px] flex-col items-center justify-center p-6 bg-background">
      {/* 圆形图标 */}
      <div className="mb-8">
        <img
          src={chrome.runtime.getURL("assets/icon.png")}
          alt="Extension Icon"
          className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-lg"
        />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("popup.welcome")}</CardTitle>
          <CardDescription>{t("popup.notLoggedIn")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleOpenLogin} className="w-full" size="lg">
            {t("popup.openLoginPage")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
function UserDashboard() {
  const { t } = useSettings()
  const { userInfo, logout } = useAuth()
  const [showKolList, setShowKolList] = useState<boolean | null>(null) // KOL显示设置
  const [isLoading, setIsLoading] = useState(true)
  const [twitterAutoQuery, setTwitterAutoQuery] = useState<boolean | null>(null) // 初始为null表示未加载

  // 添加useEffect来初始化Twitter设置
  useEffect(() => {
    const loadTwitterSettings = async () => {
      try {
        setIsLoading(true)
        // 并行加载两个设置
        const [autoQueryEnabled, kolListEnabled] = await Promise.all([
          TwitterAutoQueryManager.getAutoQueryEnabled(),
          TwitterKolListManager.getShowKolListEnabled()
        ])
        
        setTwitterAutoQuery(autoQueryEnabled)
        setShowKolList(kolListEnabled)
        console.log('📱 Twitter设置已加载:', { autoQueryEnabled, kolListEnabled })
      } catch (error) {
        console.error('❌ 加载Twitter设置失败:', error)
        // 设置默认值
        setTwitterAutoQuery(false)
        setShowKolList(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadTwitterSettings()
  }, [])

  // 打开控制台
  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("tabs/dashboard.html") })
  }
  //退出
  const handleLogout = async () => {
    await logout()
  }
  // 处理推特自动查询开关变化
  const handleTwitterAutoQueryChange = async (enabled: boolean) => {
    try {
      console.log("📱 Popup changing Twitter auto query to:", enabled)
      setTwitterAutoQuery(enabled)
      await TwitterAutoQueryManager.setAutoQueryEnabled(enabled)
    } catch (error) {
      console.error("Failed to save auto query setting:", error)
      // 回滚状态
      const currentSetting = await TwitterAutoQueryManager.getAutoQueryEnabled()
      setTwitterAutoQuery(currentSetting)
    }
  }

  // 处理KOL显示开关变化
  const handleShowKolListChange = async (enabled: boolean) => {
    try {
      console.log("📱 Popup changing KOL list setting to:", enabled)
      setShowKolList(enabled)
      await TwitterKolListManager.setShowKolListEnabled(enabled)
    } catch (error) {
      console.error("Failed to save KOL list setting:", error)
      // 回滚状态
      const currentSetting = await TwitterKolListManager.getShowKolListEnabled()
      setShowKolList(currentSetting)
    }
  }
  // 如果没有用户信息，返回未登录状态
  if (!userInfo) {
    return <LoginPrompt />
  }

  return (
    <div className="flex w-[360px] h-[600px] flex-col bg-background">
      <div className="flex flex-col p-3 space-y-3 flex-1 overflow-y-auto">
        {/* 头部用户信息 */}
        <div className="flex items-center space-x-3 p-2 bg-muted/50 rounded-lg border border-border">
          <img
            src={chrome.runtime.getURL("assets/icon.png")}
            alt="Extension Icon"
            className="w-12 h-12 rounded-full object-cover border border-border"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-foreground" />
              <span className="font-medium text-foreground">
                {userInfo.user_id}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary">{userInfo.plan}</Badge>
              <ServerStatusBadge showText={false} size="sm" enableUserStatusRefresh={true} />
            </div>
          </div>
        </div>
        {/* 使用统计 */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              {t("popup.userInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 pb-4">
            <div className="flex justify-between text-sm">
              <span>{t("userStatus.used")}</span>
              <span className="font-medium">
                {userInfo.used} / {userInfo.limit}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((userInfo.used / userInfo.limit) * 100, 100)}%`
                }}
              />
            </div>

            <Separator />

            {/* 账户功能状态 */}
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Twitter className="w-3 h-3" />
                  <span>{t("userStatus.twitterNotes")}</span>
                </div>
                <span className="font-medium">
                  {userInfo.twitter_notes_count}/{userInfo.max_twitter_accounts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Wallet className="w-3 h-3" />
                  <span>{t("userStatus.walletNotes")}</span>
                </div>
                <span className="font-medium">
                  {userInfo.wallet_notes_count}/{userInfo.max_wallet_addresses}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{t("userStatus.followTrends")}</span>
                </div>
                <span
                  className={
                    userInfo.follow_trends
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }>
                  {userInfo.follow_trends ? "✓" : "✗"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Bell className="w-3 h-3" />
                  <span>{t("userStatus.deletionReminder")}</span>
                </div>
                <span
                  className={
                    userInfo.deletion_reminder
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }>
                  {userInfo.deletion_reminder ? "✓" : "✗"}
                </span>
              </div>
            </div>

            <Separator />

            {/* 账户日期信息 */}
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("userStatus.expiryDate")}</span>
                <span>
                  {new Date(userInfo.expiry_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("userStatus.nextResetDate")}</span>
                <span>
                  {new Date(userInfo.next_reset_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Twitter设置 */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center">
              <Twitter className="w-4 h-4 mr-2" />
              {t("popup.twitterSettings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 pb-4">
            {/* 自动查询设置 */}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {t("popup.autoQueryTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("popup.autoQueryDesc")}
                </p>
              </div>
              {isLoading || twitterAutoQuery === null ? (
                <div className="w-11 h-6 bg-muted rounded-full animate-pulse ml-3" />
              ) : (
                <Switch
                  checked={twitterAutoQuery}
                  onCheckedChange={handleTwitterAutoQueryChange}
                  className="ml-3 data-[state=checked]:bg-green-500"
                />
              )}
            </div>

            <Separator />

            {/* KOL显示设置 */}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {t("popup.showKolListTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("popup.showKolListShortDesc")}
                </p>
              </div>
              {isLoading || showKolList === null ? (
                <div className="w-11 h-6 bg-muted rounded-full animate-pulse ml-3" />
              ) : (
                <Switch
                  checked={showKolList}
                  onCheckedChange={handleShowKolListChange}
                  className="ml-3 data-[state=checked]:bg-green-500"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="space-y-3 mt-4 mb-2">
          <Button
            onClick={handleOpenDashboard}
            className="w-full"
            size="default">
            {t("popup.openDashboard")}
          </Button>

          <LogoutConfirmationDialog onConfirm={handleLogout}>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              {t("common.logout")}
            </Button>
          </LogoutConfirmationDialog>
        </div>
      </div>
    </div>
  )
}
function IndexPopup() {
  const { isLoggedIn } = useAuth()
  return (
    <SettingsProvider>
      <ThemeProvider defaultTheme="system" storageKey="app-theme">
        {isLoggedIn ? <UserDashboard /> : <LoginPrompt />}
      </ThemeProvider>
    </SettingsProvider>
  )
}

export default IndexPopup
