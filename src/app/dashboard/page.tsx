"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { KpiCardsGrid } from "@/components/kpi-cards"
import { SalesForecastChart, InventoryChart, CategoryDistributionChart } from "@/components/dashboard-charts"
import { AlertsTable } from "@/components/alerts-table"
import { useAuth } from "@/lib/auth-context"
import { CalendarDays } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Dashboard de Decisiones
          </h1>
          <p className="text-sm text-muted-foreground">
            Bienvenido de nuevo, {user?.name ?? "Usuario"}. Aqui tienes un resumen de tu negocio.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm border">
          <CalendarDays className="h-4 w-4" />
          <span>Marzo 2026</span>
        </div>
      </div>

      {/* KPI Cards */}
      <section aria-label="Indicadores clave" className="mb-8">
        <KpiCardsGrid />
      </section>

      {/* Charts Row */}
      <section aria-label="Graficas" className="mb-8 grid gap-6 lg:grid-cols-2">
        <SalesForecastChart />
        <InventoryChart />
      </section>

      {/* Bottom Row */}
      <section aria-label="Detalle" className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AlertsTable />
        </div>
        <CategoryDistributionChart />
      </section>
    </DashboardLayout>
  )
}
