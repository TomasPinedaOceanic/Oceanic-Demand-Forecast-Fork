"use client"

import { useState, useEffect } from "react"
import { X, Plus } from "lucide-react"
import { StockProjectionChart } from "@/components/charts/StockProjectionChart"
import type { InventoryItem, StockoutAlert } from "@/lib/api"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function skuKey(item_id: string, store_id: string | null) {
  return `${item_id}-${store_id ?? ""}`
}

function StatusBadge({ item, isAlert }: { item: InventoryItem; isAlert: boolean }) {
  if (isAlert) {
    return (
      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
        Alerta
      </span>
    )
  }
  if (item.stock_status === "dead_stock") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
        Stock Muerto
      </span>
    )
  }
  if (item.stock_status === "slow_moving") {
    return (
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
        Mov. Lento
      </span>
    )
  }
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
      OK
    </span>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface Props {
  items: InventoryItem[]
  alerts: StockoutAlert[]
  onSelectItem?: (item: InventoryItem) => void
}

export function InventoryProjectionGrid({ items, alerts, onSelectItem }: Props) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  // Pre-cargar con SKUs en alerta al montar
  useEffect(() => {
    if (alerts.length > 0 && items.length > 0) {
      const alertKeys = alerts
        .map((a) => skuKey(a.item_id, a.store_id))
        .filter((key) => items.some((i) => skuKey(i.item_id, i.store_id) === key))
      setSelectedKeys(alertKeys)
    }
  }, [alerts, items])

  const alertKeySet = new Set(alerts.map((a) => skuKey(a.item_id, a.store_id)))

  const selectedItems = selectedKeys
    .map((key) => items.find((i) => skuKey(i.item_id, i.store_id) === key))
    .filter(Boolean) as InventoryItem[]

  const availableItems = items.filter(
    (i) => !selectedKeys.includes(skuKey(i.item_id, i.store_id))
  )

  function addSku(key: string) {
    if (key) setSelectedKeys((prev) => [...prev, key])
  }

  function removeSku(key: string) {
    setSelectedKeys((prev) => prev.filter((k) => k !== key))
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedItems.length === 0
            ? "No hay SKUs seleccionados"
            : `Mostrando ${selectedItems.length} SKU${selectedItems.length !== 1 ? "s" : ""}`}
        </p>

        {availableItems.length > 0 && (
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value=""
              onChange={(e) => addSku(e.target.value)}
            >
              <option value="">Agregar SKU...</option>
              {availableItems.map((i) => {
                const key = skuKey(i.item_id, i.store_id)
                return (
                  <option key={key} value={key}>
                    {i.item_id}{i.store_id ? ` — ${i.store_id}` : ""}
                  </option>
                )
              })}
            </select>
          </div>
        )}
      </div>

      {/* Empty state */}
      {selectedItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No hay SKUs en alerta ni seleccionados.
          </p>
          <p className="text-xs text-muted-foreground">
            Usa el selector de arriba para agregar SKUs al grid.
          </p>
        </div>
      )}

      {/* Grid de mini charts */}
      {selectedItems.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {selectedItems.map((item) => {
            const key = skuKey(item.item_id, item.store_id)
            const isAlert = alertKeySet.has(key)
            return (
              <div
                key={key}
                className="cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                onClick={() => onSelectItem?.(item)}
              >
                {/* Cabecera de la card */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                      {item.item_id}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.store_id ?? "—"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge item={item} isAlert={isAlert} />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSku(key) }}
                      className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mini gráfica */}
                <StockProjectionChart item={item} compact />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
