/**
 * Component tests for LogsPage.
 *
 * Covers US-20 — Audit Logs:
 *   - upload log filename renders when the API returns entries
 *   - empty state message renders when no upload logs exist
 *
 * The default api export is mocked so no real HTTP calls are made.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}))

jest.mock("@/components/dashboard-layout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import api from "@/lib/api"
const mockGet = api.get as jest.Mock

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LogsPage — audit logs (US-20)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("shows upload log filename when API returns upload log entries", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === "/api/logs/uploads") {
        return Promise.resolve({
          data: [
            {
              id: 1,
              filename: "sales_q1.csv",
              file_type: "sales",
              upload_date: "2024-01-15T10:00:00",
              status: "success",
              records_processed: 120,
              error_message: null,
            },
          ],
        })
      }
      return Promise.resolve({ data: [] })
    })

    const LogsPage = (await import("@/app/logs/page")).default
    render(<LogsPage />)

    await waitFor(() => {
      expect(screen.getByText("sales_q1.csv")).toBeInTheDocument()
    })
  })

  it("shows empty state message when no upload logs exist", async () => {
    mockGet.mockResolvedValue({ data: [] })

    const LogsPage = (await import("@/app/logs/page")).default
    render(<LogsPage />)

    await waitFor(() => {
      expect(
        screen.getByText("No hay registros de cargas todavía.")
      ).toBeInTheDocument()
    })
  })
})
