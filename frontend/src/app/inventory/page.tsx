"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InventoryTable } from "@/components/tables/InventoryTable"
import { Skeleton } from "@/components/ui/skeleton"
import { getInventory, type InventoryItem } from "@/lib/api"

type LoadState = "loading" | "ready" | "empty" | "error"

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [state, setState] = useState<LoadState>("loading")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    getInventory()
      .then((data) => {
        setItems(data.items)
        setState(data.items.length === 0 ? "empty" : "ready")
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setState("empty")
        } else {
          setErrorMsg(
            axios.isAxiosError(err)
              ? (err.response?.data?.detail ?? err.message)
              : "Error desconocido"
          )
          setState("error")
        }
      })
  }, [])

  const totalStock = items.reduce((acc, i) => acc + i.current_stock, 0)
  const criticalCount = items.filter((i) => i.stock_status === "critical").length
  const lowCount = items.filter((i) => i.stock_status === "low").length
  const avgLeadTime =
    items.length > 0
      ? (items.reduce((acc, i) => acc + i.lead_time_days, 0) / items.length).toFixed(1)
      : "-"

  return (
    <DashboardLayout
      title="Inventario"
      subtitle={
        state === "ready" ? `${items.length} SKUs cargados`
        : state === "loading" ? "Cargando datos..."
        : state === "empty" ? "Sin datos — sube un archivo de inventario primero"
        : "Error al cargar datos"
      }
    >
      {/* Stat cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {state === "loading" ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total en Stock"
              value={state === "ready" ? totalStock.toLocaleString() : "-"}
              sub="unidades en inventario"
            />
            <StatCard
              label="SKUs Totales"
              value={state === "ready" ? String(items.length) : "-"}
              sub="productos registrados"
            />
            <StatCard
              label="SKUs Críticos"
              value={state === "ready" ? String(criticalCount) : "-"}
              sub="sin stock disponible"
              highlight="destructive"
            />
            <StatCard
              label="Lead Time Promedio"
              value={state === "ready" ? `${avgLeadTime}d` : "-"}
              sub="días de reabastecimiento"
              highlight={lowCount > 0 ? "warning" : undefined}
            />
          </>
        )}
      </section>

      {/* Table */}
      <section>
        {state === "loading" && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        )}
        {state === "ready" && <InventoryTable items={items} />}
        {state === "empty" && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground">No hay datos de inventario disponibles.</p>
            <p className="text-sm text-muted-foreground">
              Ve a{" "}
              <a href="/data-ingestion" className="text-primary underline underline-offset-2">
                Ingesta de Datos
              </a>{" "}
              y sube un archivo de inventario.
            </p>
          </div>
        )}
        {state === "error" && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
            <p className="text-sm font-medium text-destructive">{errorMsg}</p>
          </div>
        )}
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
