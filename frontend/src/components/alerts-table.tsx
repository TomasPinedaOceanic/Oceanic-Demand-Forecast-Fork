"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, ArrowDown, TrendingDown } from "lucide-react"

const alerts = [
  {
    id: 1,
    type: "critical",
    product: "SKU-4521 - Monitor LED 24\"",
    message: "Stock por debajo del punto de reorden",
    daysToStockout: 3,
  },
  {
    id: 2,
    type: "critical",
    product: "SKU-1198 - Teclado Mecanico",
    message: "Stock por debajo del punto de reorden",
    daysToStockout: 5,
  },
  {
    id: 3,
    type: "warning",
    product: "SKU-3302 - Cable HDMI 2m",
    message: "Tendencia de demanda decreciente",
    daysToStockout: 12,
  },
  {
    id: 4,
    type: "warning",
    product: "SKU-7789 - Mouse Inalambrico",
    message: "Exceso de inventario detectado",
    daysToStockout: null,
  },
  {
    id: 5,
    type: "info",
    product: "SKU-5501 - Adaptador USB-C",
    message: "Pico de demanda proyectado para el proximo mes",
    daysToStockout: 25,
  },
]

export function AlertsTable() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alertas y Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="hidden md:table-cell">Alerta</TableHead>
              <TableHead className="text-right">Dias a Stockout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Badge
                    variant={alert.type === "critical" ? "destructive" : "secondary"}
                    className={
                      alert.type === "warning"
                        ? "bg-warning text-warning-foreground"
                        : alert.type === "info"
                          ? "bg-chart-1/10 text-chart-1"
                          : ""
                    }
                  >
                    {alert.type === "critical" ? "Critico" : alert.type === "warning" ? "Atencion" : "Info"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-card-foreground">{alert.product}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{alert.message}</TableCell>
                <TableCell className="text-right">
                  {alert.daysToStockout !== null ? (
                    <span className="flex items-center justify-end gap-1">
                      {alert.daysToStockout <= 7 ? (
                        <ArrowDown className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className={alert.daysToStockout <= 7 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                        {alert.daysToStockout} dias
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
