"use client"

import { useEffect, useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getSales, getSalesRange, getPredictions, getInventory } from "@/lib/api"
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

const COLORS = [
  "oklch(0.45 0.18 250)",
  "oklch(0.65 0.19 165)",
  "oklch(0.70 0.15 50)",
  "oklch(0.55 0.10 290)",
  "oklch(0.60 0.20 30)",
]

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="mb-1 text-sm font-medium text-card-foreground">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-xs text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ─── Sales Forecast Chart ────────────────────────────────────────────────────

interface SalesPoint {
  month: string
  actual: number | null
  predicted: number | null
}

export function SalesForecastChart() {
  const [data, setData] = useState<SalesPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Use the latest available date in the dataset as "now"
        const rangeRes = await getSalesRange().catch(() => null)
        const anchor = rangeRes ? parseISO(rangeRes.max_date) : new Date()

        // Last 6 months of sales relative to anchor
        const salesFrom = format(startOfMonth(subMonths(anchor, 5)), "yyyy-MM-dd")
        const salesTo = format(endOfMonth(anchor), "yyyy-MM-dd")
        // Next 3 months of predictions relative to anchor
        const predFrom = format(startOfMonth(subMonths(anchor, -1)), "yyyy-MM-dd")
        const predTo = format(endOfMonth(subMonths(anchor, -3)), "yyyy-MM-dd")

        const [sales, preds] = await Promise.all([
          getSales({ date_from: salesFrom, date_to: salesTo }),
          getPredictions({ date_from: predFrom, date_to: predTo }).catch(() => []),
        ])

        // Aggregate sales by month
        const salesByMonth: Record<string, number> = {}
        for (const r of sales) {
          const key = r.date.slice(0, 7) // "yyyy-MM"
          salesByMonth[key] = (salesByMonth[key] ?? 0) + r.units_sold * (r.sell_price ?? 0)
        }

        // Aggregate predictions by month
        const predByMonth: Record<string, number> = {}
        for (const r of preds) {
          const key = r.date.slice(0, 7)
          predByMonth[key] = (predByMonth[key] ?? 0) + r.yhat
        }

        // Build 9-month timeline: 6 historical + 3 forecast relative to anchor
        const points: SalesPoint[] = []
        for (let i = 5; i >= 0; i--) {
          const d = subMonths(anchor, i)
          const key = format(d, "yyyy-MM")
          points.push({
            month: format(d, "MMM", { locale: es }),
            actual: salesByMonth[key] ?? null,
            predicted: null,
          })
        }
        for (let i = 1; i <= 3; i++) {
          const d = subMonths(anchor, -i)
          const key = format(d, "yyyy-MM")
          points.push({
            month: format(d, "MMM", { locale: es }),
            actual: null,
            predicted: predByMonth[key] ?? null,
          })
        }

        setData(points)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <ChartSkeleton />

  const isEmpty = data.every((d) => d.actual === null && d.predicted === null)

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Proyección de Ventas</CardTitle>
        <CardDescription>Ventas reales vs predicción del modelo</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Sin datos — sube archivos de ventas y predicciones primero.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 247)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "oklch(0.50 0.02 264)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.50 0.02 264)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="actual"
                name="Real"
                stroke={COLORS[0]}
                strokeWidth={2}
                fill="url(#colorActual)"
                dot={false}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                name="Predicción"
                stroke={COLORS[1]}
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorPredicted)"
                dot={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Inventory Chart (Top SKUs by stock) ─────────────────────────────────────

interface InventoryPoint {
  sku: string
  stock: number
  reorder: number
}

export function InventoryChart() {
  const [data, setData] = useState<InventoryPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInventory()
      .then((res) => {
        const sorted = [...res.items]
          .sort((a, b) => b.current_stock - a.current_stock)
          .slice(0, 8)
          .map((item) => ({
            sku: item.item_id,
            stock: item.current_stock,
            reorder: item.reorder_point ?? 0,
          }))
        setData(sorted)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ChartSkeleton />

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Top SKUs por Stock</CardTitle>
        <CardDescription>Stock actual vs punto de reorden — top 8 SKUs</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Sin datos — sube un archivo de inventario primero.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 247)" />
              <XAxis
                dataKey="sku"
                tick={{ fill: "oklch(0.50 0.02 264)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fill: "oklch(0.50 0.02 264)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="stock" name="Stock Actual" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
              <Bar dataKey="reorder" name="Punto Reorden" fill={COLORS[2]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Category Distribution Chart ─────────────────────────────────────────────

interface CategoryPoint {
  name: string
  value: number
}

export function CategoryDistributionChart() {
  const [data, setData] = useState<CategoryPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSales()
      .then((sales) => {
        const byCategory: Record<string, number> = {}
        for (const r of sales) {
          const cat = r.cat_id ?? r.dept_id ?? "Sin categoría"
          byCategory[cat] = (byCategory[cat] ?? 0) + r.units_sold
        }
        const total = Object.values(byCategory).reduce((s, v) => s + v, 0)
        const points = Object.entries(byCategory)
          .map(([name, value]) => ({ name, value: Math.round((value / total) * 100) }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
        setData(points)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ChartSkeleton />

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Distribución por Categoría</CardTitle>
        <CardDescription>Porcentaje de unidades vendidas por categoría</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Sin datos — sube un archivo de ventas primero.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, ""]}
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.91 0.005 247)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: "oklch(0.50 0.02 264)", fontSize: "12px" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
