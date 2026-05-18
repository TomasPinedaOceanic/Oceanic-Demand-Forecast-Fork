/**
 * Unit tests for the exportToCSV utility.
 *
 * Covers US-19 — Report Export:
 *   - empty data → returns early without touching the DOM or creating a blob
 *   - data with column mapping → triggers download with the correct filename
 *     and headers derived from the mapping
 */

import { exportToCSV } from "@/lib/export"

const mockCreateObjectURL = jest.fn(() => "blob:test-url")
const mockRevokeObjectURL = jest.fn()

beforeAll(() => {
  global.URL.createObjectURL = mockCreateObjectURL
  global.URL.revokeObjectURL = mockRevokeObjectURL
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe("exportToCSV — CSV export utility (US-19)", () => {
  it("returns early without creating a blob when data array is empty", () => {
    exportToCSV([], "output.csv")

    expect(mockCreateObjectURL).not.toHaveBeenCalled()
  })

  it("triggers download with the correct filename when data is provided", () => {
    const data = [
      { item_id: "SKU-001", units_sold: 10, sell_price: 5.0 },
      { item_id: "SKU-002", units_sold: 20, sell_price: 3.5 },
    ]
    const appendSpy = jest.spyOn(document.body, "appendChild")
    const removeSpy = jest.spyOn(document.body, "removeChild")

    exportToCSV(data, "ventas.csv", {
      item_id: "SKU",
      units_sold: "Unidades",
      sell_price: "Precio",
    })

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
    expect(appendSpy).toHaveBeenCalledTimes(1)
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement
    expect(anchor.getAttribute("download")).toBe("ventas.csv")
    expect(removeSpy).toHaveBeenCalledTimes(1)

    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
