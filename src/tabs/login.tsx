import React, { useState } from "react";
import "../styles/style.css"
import ServerStatusCheck from "~src/components/login/ServerStatusCheck";
import { Card, CardContent } from "~src/components/ui/card";
import { Progress } from "~src/components/ui/progress";
import { SettingsProvider, useSettings } from "~src/contexts/SettingsContext"
import { ThemeProvider } from "~src/contexts/ThemeContext"
import type { Language } from "~src/types/i18n.types";
import LanguageSelection from "~src/components/login/LanguageSelection";
import TokenInput from "~src/components/login/TokenInput";
import TokenVerification from "~src/components/login/TokenVerification";
import type { StepData } from "~src/types/login.types";
import ThemeSelection from "~src/components/login/ThemeSelection";
import TermsAgreement from "~src/components/login/TermsAgreement";
import DataCacheStep from "~src/components/login/DataCacheStep";
import { TwitterSettingsStep } from "~src/components/login/TwitterSettingsStep";
import { DexPlatformSettingsStep } from "~src/components/login/DexPlatformSettingsStep";
import SetupComplete from "~src/components/login/SetupComplete";
// 登录步骤枚举
enum LoginStep {
    SERVER_STATUS_CHECK = 1,
    LANGUAGE_SELECTION = 2,
    TOKEN_INPUT = 3,
    TOKEN_VERIFICATION = 4,
    THEME_SELECTION = 5,
    TERMS_AGREEMENT = 6,
    DATA_CACHE = 7,
    TWITTER_SETTINGS = 8,
    DEX_PLATFORM_SETTINGS = 9,
    SETUP_COMPLETE = 10
}
// 总共步数

const TOTAL_STEPS = 10;

function LoginPage() {
    const [currentStep, setCurrentStep] = useState<LoginStep>(LoginStep.SERVER_STATUS_CHECK);
    const [stepData, setStepData] = useState<StepData>({});
    const [isLoading, setIsLoading] = useState(false);

    const { t } = useSettings();

    // 更新步骤数据
    const updateStepData = (data: Partial<StepData>) => {
        setStepData(prev => ({ ...prev, ...data }));
    };

    // 语言变化处理函数 - 移除重复的setLanguage调用
    const handleLanguageChange = (newLanguage: Language) => {
        // 只更新stepData，不再调用setLanguage（LanguageSelection组件已经调用了）
        updateStepData({ language: newLanguage });
    };

    // 下一步
    const nextStep = () => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(currentStep + 1);
        }
    };

    // 上一步
    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // 完成登录流程
    const completeLogin = () => {
        // 关闭登录页面
        window.close();
    };
    // 渲染当前步骤组件
    const renderCurrentStep = () => {
        switch (currentStep) {
            case LoginStep.SERVER_STATUS_CHECK:
                return (
                    <ServerStatusCheck
                        onNext={nextStep}
                    />
                );
            case LoginStep.LANGUAGE_SELECTION:
                return (
                    <LanguageSelection
                        onNext={nextStep}
                        onLanguageChange={handleLanguageChange}
                        selectedLanguage={stepData.language}
                    />
                );
            case LoginStep.TOKEN_INPUT:
                return (
                    <TokenInput
                        onNext={nextStep}
                        onPrev={prevStep}
                        onTokenChange={(token) => updateStepData({ token })}
                        token={stepData.token}
                    />
                );
            case LoginStep.TOKEN_VERIFICATION:
                return (
                    <TokenVerification
                        token={stepData.token!}
                        onNext={nextStep}
                        onPrev={prevStep}
                        onVerificationSuccess={(userInfo) => updateStepData({ userInfo })}
                        setIsLoading={setIsLoading}
                    />
                );
            case LoginStep.THEME_SELECTION:
                return (
                    <ThemeSelection
                        onNext={nextStep}
                        onPrev={prevStep}
                        onThemeChange={(theme) => updateStepData({ theme })}
                        selectedTheme={stepData.theme}
                    />
                );
            case LoginStep.TERMS_AGREEMENT:
                return (
                    <TermsAgreement
                        onNext={() => setCurrentStep(LoginStep.DATA_CACHE)}
                        onPrev={prevStep}
                        onTermsAccept={(accepted) => updateStepData({ termsAccepted: accepted })}
                        termsAccepted={stepData.termsAccepted}
                    />
                );
            case LoginStep.DATA_CACHE:
                return (
                    <DataCacheStep
                        onComplete={() => setCurrentStep(LoginStep.TWITTER_SETTINGS)}
                        stepData={stepData}
                    />
                );
            case LoginStep.TWITTER_SETTINGS:
            return (
                <TwitterSettingsStep
                    onNext={() => setCurrentStep(LoginStep.DEX_PLATFORM_SETTINGS)}
                    onPrev={() => setCurrentStep(LoginStep.DATA_CACHE)}
                    onSettingsChange={(settings) => updateStepData(settings)}
                    twitterAutoQuery={stepData.twitterAutoQuery}
                />
            );
            case LoginStep.DEX_PLATFORM_SETTINGS:
                return (
                    <DexPlatformSettingsStep
                        onNext={() => setCurrentStep(LoginStep.SETUP_COMPLETE)}
                        onPrev={() => setCurrentStep(LoginStep.TWITTER_SETTINGS)}
                    />
                );
            case LoginStep.SETUP_COMPLETE:
                return (
                    <SetupComplete
                        onComplete={completeLogin}
                        stepData={stepData}
                    />
                );
            default:
            return null;
        }

    };
    // 获取步骤标题
    const getStepTitle = () => {
        switch (currentStep) {
            case LoginStep.SERVER_STATUS_CHECK:
                return t('login.serverStatusCheck');
            case LoginStep.LANGUAGE_SELECTION:
                return t('login.selectLanguage');
            case LoginStep.TOKEN_INPUT:
                return t('login.enterToken');
            case LoginStep.TOKEN_VERIFICATION:
                return t('login.verifying');
            case LoginStep.THEME_SELECTION:
                return t('login.selectTheme');
            case LoginStep.TERMS_AGREEMENT:
                return t('login.termsTitle');
            case LoginStep.DATA_CACHE:
                return t('login.cachingData');
            case LoginStep.TWITTER_SETTINGS:
                return t('login.twitterSettings');
            case LoginStep.DEX_PLATFORM_SETTINGS:
                return t('login.dexPlatformSettings');
            case LoginStep.SETUP_COMPLETE:
                return t('login.setupComplete');
            default:
                return '';
        }
    };
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* 头部进度条 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <img
                                src={chrome.runtime.getURL("assets/icon.png")}
                                alt="Extension Icon"
                                className="w-10 h-10 rounded-full object-cover border border-border"
                            />
                            <h1 className="text-2xl font-bold">{getStepTitle()}</h1>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {currentStep} / {TOTAL_STEPS}
                        </div>
                    </div>
                    <Progress
                        value={(currentStep / TOTAL_STEPS) * 100}
                        className="h-2"
                    />
                </div>

                {/* 主要内容区域 */}
                <Card className="shadow-lg">
                    <CardContent className="p-8">
                        {renderCurrentStep()}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
function LoginTab() {
    return (
        <SettingsProvider>
            <ThemeProvider defaultTheme="system" storageKey="app-theme">
                <LoginPage />
            </ThemeProvider>
        </SettingsProvider>
    )
}

export default LoginTab