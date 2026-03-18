"use client"

import { Bell } from "lucide-react"
import type { PredictionsStatus } from "@/lib/api"

interface NotificationBellProps {
  status: PredictionsStatus["status"]
  hasActiveNotification: boolean
  onClick: () => void
}

export function NotificationBell({ hasActiveNotification, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      title="Notificaciones"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Bell className="h-4 w-4" />
      {hasActiveNotification && (
        <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-destructive" />
      )}
      <span className="sr-only">Notificaciones</span>
    </button>
  )
}
