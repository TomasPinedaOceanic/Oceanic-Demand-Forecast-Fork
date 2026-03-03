"use client"

import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: "revenue" | "inventory" | "orders" | "alerts"
}

const iconMap = {
  revenue: DollarSign,
  inventory: Package,
  orders: ShoppingCart,
  alerts: AlertTriangle,
}

const iconBgMap = {
  revenue: "bg-chart-1/10 text-chart-1",
  inventory: "bg-chart-2/10 text-chart-2",
  orders: "bg-chart-3/10 text-chart-3",
  alerts: "bg-destructive/10 text-destructive",
}

export function KpiCard({ title, value, change, changeType, icon }: KpiCardProps) {
  const Icon = iconMap[icon]

  return (
    <Card className="bg-card">
      <CardContent className="flex items-start justify-between pt-0">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className="text-2xl font-bold tracking-tight text-card-foreground">{value}</span>
          <div className="flex items-center gap-1">
            {changeType === "positive" ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : changeType === "negative" ? (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            ) : null}
            <span
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground",
              )}
            >
              {change}
            </span>
          </div>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBgMap[icon])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

export function KpiCardsGrid() {
  const kpis: KpiCardProps[] = [
    {
      title: "Ventas del Mes",
      value: "$124.5M",
      change: "+12.5% vs mes anterior",
      changeType: "positive",
      icon: "revenue",
    },
    {
      title: "Unidades en Stock",
      value: "8,432",
      change: "-3.2% vs mes anterior",
      changeType: "negative",
      icon: "inventory",
    },
    {
      title: "Ordenes Procesadas",
      value: "1,247",
      change: "+8.1% vs mes anterior",
      changeType: "positive",
      icon: "orders",
    },
    {
      title: "Alertas Activas",
      value: "23",
      change: "5 criticas pendientes",
      changeType: "neutral",
      icon: "alerts",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.title} {...kpi} />
      ))}
    </div>
  )
}
