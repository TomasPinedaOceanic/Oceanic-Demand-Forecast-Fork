/**
 * Component tests for InventoryProjectionGrid.
 *
 * Covers US-18 — Future Inventory Projection:
 *   - shows loading indicator while forecasts are being fetched
 *   - renders an item card for each provided inventory item
 *   - items with an active stockout alert show the "Alerta" badge
 *   - items without alerts show the "OK" badge
 *
 * StockProjectionChart is mocked to avoid recharts rendering issues in jsdom.
 */

import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { InventoryProjectionGrid } from "@/components/charts/InventoryProjectionGrid"
import type { InventoryItem, StockoutAlert } from "@/lib/api"

jest.mock("@/components/charts/StockProjectionChart", () => ({
  StockProjectionChart: () => <div data-testid="stock-projection-chart" />,
}))

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    item_id: "SKU-001",
    store_id: "S1",
    current_stock: 100,
    available_stock: 100,
    lead_time_days: 7,
    unit_cost: 10.0,
    next_month_forecast: 300,
    stock_status: "ok",
    last_updated: "2024-01-01",
    reorder_point: null,
    slow_moving_flag: null,
    immobilized_capital: null,
    days_of_stock: null,
    ...overrides,
  }
}

function makeAlert(item_id: string): StockoutAlert {
  return {
    item_id,
    store_id: "S1",
    current_stock: 5,
    lead_time_days: 10,
    avg_daily_demand: 10.0,
    demand_during_lead_time: 100.0,
    days_of_stock: 0.5,
    stockout_date: "2024-02-01",
    stock_status: "critical",
    units_to_order: 120,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("InventoryProjectionGrid — stock projection (US-18)", () => {
  it("shows loading indicator when predsLoading is true", () => {
    render(
      <InventoryProjectionGrid
        items={[makeItem()]}
        alerts={[]}
        allPredictions={[]}
        predsLoading={true}
      />
    )

    expect(screen.getByText("Cargando forecast...")).toBeInTheDocument()
  })

  it("renders a card for each item when not loading", () => {
    const items = [
      makeItem({ item_id: "SKU-001" }),
      makeItem({ item_id: "SKU-002" }),
    ]

    render(
      <InventoryProjectionGrid
        items={items}
        alerts={[]}
        allPredictions={[]}
        predsLoading={false}
      />
    )

    expect(screen.getByText("SKU-001")).toBeInTheDocument()
    expect(screen.getByText("SKU-002")).toBeInTheDocument()
  })

  it("shows 'Alerta' badge for items with an active stockout alert", () => {
    const item = makeItem({ item_id: "CRIT-001" })
    const alert = makeAlert("CRIT-001")

    render(
      <InventoryProjectionGrid
        items={[item]}
        alerts={[alert]}
        allPredictions={[]}
        predsLoading={false}
      />
    )

    expect(screen.getByText("Alerta")).toBeInTheDocument()
  })

  it("shows 'OK' badge for items with no active alert", () => {
    const item = makeItem({ item_id: "OK-001", stock_status: "ok" })

    render(
      <InventoryProjectionGrid
        items={[item]}
        alerts={[]}
        allPredictions={[]}
        predsLoading={false}
      />
    )

    expect(screen.getByText("OK")).toBeInTheDocument()
  })
})
