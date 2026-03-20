"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import type { InventoryItem } from "@/lib/api"

function StockStatusBadge({ status }: { status: string }) {
  if (status === "critical") {
    return <Badge variant="destructive">Crítico</Badge>
  }
  if (status === "low") {
    return <Badge variant="secondary" className="bg-warning/10 text-warning">Bajo</Badge>
  }
  if (status === "ok") {
    return <Badge variant="secondary" className="bg-success/10 text-success">OK</Badge>
  }
  return <Badge variant="outline" className="text-muted-foreground">Pendiente</Badge>
}

interface InventoryTableProps {
  items: InventoryItem[]
}

export function InventoryTable({ items }: InventoryTableProps) {
  const [search, setSearch] = useState("")

  const filtered = items.filter((item) =>
    item.item_id.toLowerCase().includes(search.toLowerCase())
  )

  const criticalCount = items.filter((i) => i.stock_status === "critical").length
  const lowCount = items.filter((i) => i.stock_status === "low").length

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-card-foreground">Inventario por SKU</CardTitle>
            <CardDescription>
              {criticalCount > 0 && `${criticalCount} críticos · `}
              {lowCount > 0 && `${lowCount} en atención · `}
              {items.length} SKUs totales
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead className="hidden sm:table-cell">Tienda</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right hidden md:table-cell">Disponible</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Reorden</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Lead Time</TableHead>
                <TableHead className="text-right hidden xl:table-cell">Costo Unit.</TableHead>
                <TableHead className="hidden xl:table-cell">Actualizado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No se encontraron SKUs
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={`${item.item_id}-${item.store_id}`}>
                    <TableCell className="text-sm font-medium text-card-foreground">
                      {item.item_id}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {item.store_id ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-card-foreground">
                      {item.current_stock.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                      {item.available_stock.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground hidden lg:table-cell">
                      {item.reorder_point != null ? item.reorder_point.toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground hidden lg:table-cell">
                      {item.lead_time_days}d
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground hidden xl:table-cell">
                      ${item.unit_cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                      {item.last_updated}
                    </TableCell>
                    <TableCell>
                      <StockStatusBadge status={item.stock_status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
