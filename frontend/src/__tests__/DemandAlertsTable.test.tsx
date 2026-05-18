/**
 * Component tests for DemandAlertsTable.
 *
 * Covers US-17 — Demand Prediction Alerts:
 *   - empty state message when no demand alerts exist
 *   - critical alert renders "Crítico" badge and item_id
 *   - warning alert renders "Atención" badge
 *
 * API calls are mocked so tests are self-contained.
 */

import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DemandAlertsTable } from "@/components/demand-alerts-table"
import { getDemandAlerts } from "@/lib/api"
import type { DemandAlert } from "@/lib/api"

jest.mock("@/lib/api", () => ({
  getDemandAlerts: jest.fn(),
}))

const mockedGetDemandAlerts = getDemandAlerts as jest.MockedFunction<
  typeof getDemandAlerts
>

// ---------------------------------------------------------------------------
// Test data factory
// ---------------------------------------------------------------------------

function makeDemandAlert(overrides: Partial<DemandAlert> = {}): DemandAlert {
  return {
    item_id: "FOODS_001",
    historical_avg: 2.0,
    forecast_avg: 3.0,
    deviation_pct: 50.0,
    direction: "surge",
    severity: "critical",
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
})

describe("DemandAlertsTable — demand deviation alerts (US-17)", () => {
  it("shows empty state when API returns no alerts", async () => {
    mockedGetDemandAlerts.mockResolvedValueOnce({
      alerts: [],
      message: "",
    })

    render(<DemandAlertsTable />)

    await waitFor(() => {
      expect(screen.getByText(/Sin alertas/i)).toBeInTheDocument()
    })
  })

  it("renders 'Crítico' badge and item_id for a critical alert", async () => {
    mockedGetDemandAlerts.mockResolvedValueOnce({
      alerts: [makeDemandAlert({ item_id: "FOODS_001", severity: "critical" })],
      message: "Alertas calculadas.",
    })

    render(<DemandAlertsTable />)

    await waitFor(() => {
      expect(screen.getByText("Crítico")).toBeInTheDocument()
      expect(screen.getByText("FOODS_001")).toBeInTheDocument()
    })
  })

  it("renders 'Atención' badge for a warning-severity alert", async () => {
    mockedGetDemandAlerts.mockResolvedValueOnce({
      alerts: [makeDemandAlert({ severity: "warning", deviation_pct: 30.0 })],
      message: "",
    })

    render(<DemandAlertsTable />)

    await waitFor(() => {
      expect(screen.getByText("Atención")).toBeInTheDocument()
    })
  })
})
