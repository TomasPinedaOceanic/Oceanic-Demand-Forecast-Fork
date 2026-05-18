/**
 * Component tests for VentasHistoricasPage.
 *
 * Covers US-15 — Sales View:
 *   - KPI card "Unidades Vendidas" reflects the total from the API response
 *   - "Sin datos" renders in the top-SKU card when the API returns no records
 *
 * API calls and heavy dependencies are mocked.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { getSales, getSalesRange } from "@/lib/api"

jest.mock("@/lib/api", () => ({
  getSales: jest.fn(),
  getSalesRange: jest.fn(),
}))

jest.mock("@/components/dashboard-layout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  BarChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
}))

const mockGetSales = getSales as jest.MockedFunction<typeof getSales>
const mockGetSalesRange = getSalesRange as jest.MockedFunction<typeof getSalesRange>

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VentasHistoricasPage — historical sales view (US-15)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSalesRange.mockResolvedValue({
      min_date: "2017-01-01",
      max_date: "2017-06-30",
    })
  })

  it("displays total units sold matching the sum returned by the API", async () => {
    mockGetSales.mockResolvedValue([
      {
        item_id: "FOODS_001",
        store_id: "S1",
        cat_id: "FOODS",
        dept_id: null,
        date: "2017-06-01",
        units_sold: 10,
        sell_price: 5.0,
      },
      {
        item_id: "FOODS_001",
        store_id: "S1",
        cat_id: "FOODS",
        dept_id: null,
        date: "2017-06-02",
        units_sold: 15,
        sell_price: 5.0,
      },
    ])

    const VentasPage = (await import("@/app/ventas-historicas/page")).default
    render(<VentasPage />)

    await waitFor(() => {
      // KPI card label
      expect(screen.getByText("Unidades Vendidas")).toBeInTheDocument()
      // 10 + 15 = 25 formatted with es-CO locale
      expect(screen.getByText("25")).toBeInTheDocument()
    })
  })

  it("shows 'Sin datos' in the top-SKU card when the API returns no sales", async () => {
    mockGetSales.mockResolvedValue([])

    const VentasPage = (await import("@/app/ventas-historicas/page")).default
    render(<VentasPage />)

    await waitFor(() => {
      expect(screen.getByText("Sin datos")).toBeInTheDocument()
    })
  })
})
