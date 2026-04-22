"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, ArrowDown, TrendingDown } from "lucide-react"
import { getInventoryAlerts, type StockoutAlert } from "@/lib/api"

export function AlertsTable() {
  const [alerts, setAlerts] = useState<StockoutAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1)
    window.addEventListener("pipeline:dataready", handler)
    return () => window.removeEventListener("pipeline:dataready", handler)
  }, [])

  useEffect(() => {
    setLoading(true)
    getInventoryAlerts()
      .then((res) => setAlerts(res.alerts))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [refreshKey])

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alertas de Stockout
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sin alertas activas — todos los SKUs tienen stock suficiente para cubrir su lead time.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="hidden md:table-cell">Stock disponible</TableHead>
                <TableHead className="hidden md:table-cell">Demanda en lead time</TableHead>
                <TableHead className="text-right">Días a stockout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.item_id}>
                  <TableCell>
                    <Badge
                      variant={alert.stock_status === "critical" ? "destructive" : "secondary"}
                      className={
                        alert.stock_status === "low"
                          ? "bg-warning text-warning-foreground"
                          : ""
                      }
                    >
                      {alert.stock_status === "critical" ? "Crítico" : "Atención"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-card-foreground">
                    {alert.item_id}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {alert.current_stock.toLocaleString()} uds
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {alert.demand_during_lead_time.toFixed(0)} uds ({alert.lead_time_days}d)
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      {alert.days_of_stock <= 7 ? (
                        <ArrowDown className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span
                        className={
                          alert.days_of_stock <= 7
                            ? "font-semibold text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {alert.days_of_stock} días
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}