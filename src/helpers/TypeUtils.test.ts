import { describe, expect, it, vi } from "vitest"
import { filter, map } from "./TypeUtils"

describe("map", () => {
  it("applies the function to a present value", () => {
    expect(map(21, (value) => value * 2)).toBe(42)
  })

  it("applies the function to falsy-but-present values", () => {
    expect(map(0, (value) => value + 1)).toBe(1)
    expect(map("", (value) => `${value}!`)).toBe("!")
  })

  it.each([
    ["null", null],
    ["undefined", undefined],
  ])("passes %s straight through without calling the function", (_description, value) => {
    const fn = vi.fn()

    expect(map(value, fn)).toBe(value)
    expect(fn).not.toHaveBeenCalled()
  })
})

describe("filter", () => {
  it("returns the value when the predicate holds", () => {
    expect(filter(42, (value) => value > 0)).toBe(42)
  })

  it("returns null when the predicate fails", () => {
    expect(filter(42, (value) => value < 0)).toBeNull()
  })

  it.each([
    ["null", null],
    ["undefined", undefined],
  ])("passes %s straight through without calling the predicate", (_description, value) => {
    const predicate = vi.fn()

    expect(filter(value, predicate)).toBe(value)
    expect(predicate).not.toHaveBeenCalled()
  })
})
