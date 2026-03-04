"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { skuInventory } from "@/data/inventoryData"
import { Search } from "lucide-react"

export function InventoryTable() {
  const [search, setSearch] = useState("")

  const filtered = skuInventory.filter((item) =>
    item.sku.toLowerCase().includes(search.toLowerCase())
  )

  const criticalCount = skuInventory.filter((i) => i.status === "critical").length
  const warningCount = skuInventory.filter((i) => i.status === "warning").length

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-card-foreground">Inventario por SKU</CardTitle>
            <CardDescription>
              {criticalCount} críticos · {warningCount} en atención · {skuInventory.length} SKUs totales
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
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right hidden md:table-cell">Reorden</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Venta/día</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Precio</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.sku}>
                  <TableCell className="font-mono text-sm text-card-foreground">
                    {item.sku}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-card-foreground">
                    {item.stock.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                    {item.reorderPoint.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden lg:table-cell">
                    {item.avgDaily.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden lg:table-cell">
                    ${item.price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
