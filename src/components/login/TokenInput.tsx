import { Eye, EyeOff, Info, Key } from "lucide-react"
import React, { useState } from "react";

import { Alert, AlertDescription } from "~src/components/ui/alert"
import { Button } from "~src/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "~src/components/ui/card"
import { Input } from "~src/components/ui/input"
import { Label } from "~src/components/ui/label"
import { useSettings } from "~src/contexts/SettingsContext";


interface TokenInputProps {
    onNext: () => void
    onPrev: () => void
    onTokenChange: (token: string) => void
    token?: string
}

function TokenInput({
    onNext,
    onPrev,
    onTokenChange,
    token = ""
}: TokenInputProps) {
    const { t } = useSettings()
    const [inputToken, setInputToken] = useState(token)
    const [showToken, setShowToken] = useState(false)
    const [error, setError] = useState("")

    // 处理token输入
    const handleTokenChange = (value: string) => {
        setInputToken(value)
        setError("")
        onTokenChange(value)
    }

    // 验证token格式
    const validateToken = (token: string): boolean => {
        // 基本验证：不为空且长度合理
        if (!token.trim()) {
            setError(t("login.tokenEmpty"))
            return false
        }

        if (token.length < 10) {
            setError(t("login.tokenTooShort"))
            return false
        }

        return true
    }

    // 处理下一步
    const handleNext = () => {
        if (validateToken(inputToken)) {
            onNext()
        }
    }

    // 处理粘贴
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText()
            if (text) {
                handleTokenChange(text.trim())
            }
        } catch (err) {
            console.error("Failed to read clipboard:", err)
        }
    }

    return (
        <div className="space-y-6">
            {/* 标题区域 */}
            <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Key className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">{t("login.enterToken")}</h2>
                <p className="text-muted-foreground">
                    {t("login.tokenDescription")}
                </p>
            </div>

            {/* Token输入区域 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <Key className="w-5 h-5 mr-2" />
                        {t("login.authorizationToken")}
                    </CardTitle>
                    <CardDescription>{t("login.tokenHelp")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="token">{t("login.enterToken")}</Label>
                        <div className="relative">
                            <Input
                                id="token"
                                type={showToken ? "text" : "password"}
                                placeholder={t("login.tokenPlaceholder")}
                                value={inputToken}
                                onChange={(e) =>
                                    handleTokenChange(e.target.value)
                                }
                                className={error ? "border-destructive" : ""}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlePaste}
                                    className="h-8 w-8 p-0"
                                    title={t("login.pasteFromClipboard")}>
                                    📋
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowToken(!showToken)}
                                    className="h-8 w-8 p-0">
                                    {showToken ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>

                    {/* 帮助信息 */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            {t("login.tokenSecurityInfo")}
                        </AlertDescription>
                    </Alert>
                    {/* Token示例 */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-2">
                            {t("login.exampleFormat")}
                        </div>
                        <code className="text-xs bg-background px-2 py-1 rounded">
                            Tw36aa2b1d589d49fb3d70ed9c0975a...
                        </code>
                    </div>
                </CardContent>
            </Card>

            {/* 导航按钮 */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrev}>
                    {t("common.previous")}
                </Button>
                <Button onClick={handleNext} disabled={!inputToken.trim()}>
                    {t("common.next")}
                </Button>
            </div>
        </div>
    )
}

export default TokenInput
