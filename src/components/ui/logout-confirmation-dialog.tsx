import { AlertTriangle, Loader2, LogOut } from "lucide-react"
import React, { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "~src/components/ui/alert-dialog"
import { useSettings } from "~src/contexts/SettingsContext"

interface LogoutConfirmationDialogProps {
  children: React.ReactNode
  onConfirm: () => Promise<void> | void
}

function LogoutConfirmationDialog({
  children,
  onConfirm
}: LogoutConfirmationDialogProps) {
  const { t } = useSettings()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleConfirm = async () => {
    setIsLoggingOut(true)
    try {
      await onConfirm()
      setIsOpen(false)
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg">
                {t("logout.confirmTitle")}
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className="text-sm text-muted-foreground">
          {t("logout.confirmDescription")}
        </AlertDialogDescription>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <AlertDialogCancel disabled={isLoggingOut} className="mt-2 sm:mt-0">
            {t("common.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("logout.loggingOut")}
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                {t("logout.confirmButton")}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default LogoutConfirmationDialog
