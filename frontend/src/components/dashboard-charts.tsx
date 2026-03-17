"use client"

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

// Sales forecast data
const salesData = [
  { month: "Ene", actual: 85, predicted: 82 },
  { month: "Feb", actual: 92, predicted: 89 },
  { month: "Mar", actual: 78, predicted: 80 },
  { month: "Abr", actual: 105, predicted: 100 },
  { month: "May", actual: 110, predicted: 108 },
  { month: "Jun", actual: 95, predicted: 97 },
  { month: "Jul", actual: null, predicted: 112 },
  { month: "Ago", actual: null, predicted: 118 },
  { month: "Sep", actual: null, predicted: 125 },
]

// Inventory by category
const inventoryData = [
  { category: "Electronica", stock: 2450, reorder: 800 },
  { category: "Alimentos", stock: 1800, reorder: 1200 },
  { category: "Textiles", stock: 920, reorder: 400 },
  { category: "Hogar", stock: 1340, reorder: 600 },
  { category: "Salud", stock: 780, reorder: 500 },
]

// Category distribution
const categoryData = [
  { name: "Electronica", value: 35 },
  { name: "Alimentos", value: 25 },
  { name: "Textiles", value: 15 },
  { name: "Hogar", value: 15 },
  { name: "Salud", value: 10 },
]

const COLORS = [
  "oklch(0.45 0.18 250)",
  "oklch(0.65 0.19 165)",
  "oklch(0.70 0.15 50)",
  "oklch(0.55 0.10 290)",
  "oklch(0.60 0.20 30)",
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <p className="mb-1 text-sm font-medium text-card-foreground">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

export function SalesForecastChart() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Proyeccion de Ventas</CardTitle>
        <CardDescription>
          Ventas reales vs prediccion del modelo (millones COP)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.45 0.18 250)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.45 0.18 250)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.65 0.19 165)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.65 0.19 165)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 247)" />
            <XAxis dataKey="month" tick={{ fill: "oklch(0.50 0.02 264)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.50 0.02 264)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="oklch(0.45 0.18 250)"
              strokeWidth={2}
              fill="url(#colorActual)"
              dot={{ fill: "oklch(0.45 0.18 250)", r: 4 }}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              name="Prediccion"
              stroke="oklch(0.65 0.19 165)"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorPredicted)"
              dot={{ fill: "oklch(0.65 0.19 165)", r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function InventoryChart() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Inventario por Categoria</CardTitle>
        <CardDescription>Stock actual vs punto de reorden</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={inventoryData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 247)" />
            <XAxis dataKey="category" tick={{ fill: "oklch(0.50 0.02 264)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.50 0.02 264)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="stock" name="Stock Actual" fill="oklch(0.45 0.18 250)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="reorder" name="Punto Reorden" fill="oklch(0.70 0.15 50)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function CategoryDistributionChart() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Distribucion por Categoria</CardTitle>
        <CardDescription>Porcentaje de ventas por linea de producto</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
            >
              {categoryData.map((_, index) => (
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
              formatter={(value: string) => <span style={{ color: "oklch(0.50 0.02 264)", fontSize: "12px" }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
