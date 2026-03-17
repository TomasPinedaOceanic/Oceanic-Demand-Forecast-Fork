"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ForecastChart, TopSkusChart } from "@/components/charts/ForecastChart"
import { InventoryTable } from "@/components/tables/InventoryTable"
import { skuInventory } from "@/data/inventoryData"

export default function InventoryPage() {
  const criticalCount = skuInventory.filter((i) => i.status === "critical").length
  const warningCount = skuInventory.filter((i) => i.status === "warning").length
  const totalStock = skuInventory.reduce((acc, i) => acc + i.stock, 0)
  const avgDaily = skuInventory.reduce((acc, i) => acc + i.avgDaily, 0)

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Inventario y Predicciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos históricos CA_1 · 35 SKUs · Mayo 2016
        </p>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total en Stock" value={totalStock.toLocaleString()} sub="unidades activas" />
        <StatCard label="Venta Promedio/día" value={avgDaily.toFixed(0)} sub="todas las categorías" />
        <StatCard label="SKUs Críticos" value={String(criticalCount)} sub="sin stock disponible" highlight="destructive" />
        <StatCard label="SKUs en Atención" value={String(warningCount)} sub="cerca del punto de reorden" highlight="warning" />
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <ForecastChart />
        <TopSkusChart />
      </section>

      <section>
        <InventoryTable />
      </section>
    </DashboardLayout>
  )
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub: string
  highlight?: "destructive" | "warning"
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={
          highlight === "destructive"
            ? "mt-1 text-2xl font-bold text-destructive"
            : highlight === "warning"
            ? "mt-1 text-2xl font-bold text-warning"
            : "mt-1 text-2xl font-bold tracking-tight text-card-foreground"
        }
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}
