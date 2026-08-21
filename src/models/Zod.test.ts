import { describe, expect, it, vi } from "vitest"
import { z } from "zod/v4"
import { DateTime, Duration } from "luxon"
import { ZodDateTime, ZodDuration, zodParse } from "./Zod"

describe("ZodDateTime", () => {
  it("parses an offset-bearing ISO string into an equivalent DateTime", () => {
    const parsed = ZodDateTime.parse("2026-08-21T13:45:30.000Z")

    expect(DateTime.isDateTime(parsed)).toBe(true)
    expect(parsed.toUTC().toISO()).toBe("2026-08-21T13:45:30.000Z")
  })

  it("preserves the instant for a non-UTC offset", () => {
    const parsed = ZodDateTime.parse("2026-08-21T13:45:30+10:00")

    expect(parsed.toUTC().toISO()).toBe("2026-08-21T03:45:30.000Z")
  })

  it.each([
    ["a date without a time", "2026-08-21"],
    ["a timestamp without an offset", "2026-08-21T13:45:30"],
    ["a non-date string", "not a timestamp"],
    ["a number", 1787314470],
    ["null", null],
  ])("rejects %s", (_description, value) => {
    expect(() => ZodDateTime.parse(value)).toThrow()
  })
})

describe("ZodDuration", () => {
  it.each([
    ["seconds", 90, "seconds", 90_000],
    ["minutes", 3, "minutes", 180_000],
    ["hours", 2, "hours", 7_200_000],
  ])("converts %s into a Duration", (_description, length, unit, expectedMillis) => {
    const parsed = ZodDuration.parse({ length, unit })

    expect(Duration.isDuration(parsed)).toBe(true)
    expect(parsed.toMillis()).toBe(expectedMillis)
  })

  it.each([
    ["a missing unit", { length: 90 }],
    ["a missing length", { unit: "seconds" }],
    ["a non-numeric length", { length: "90", unit: "seconds" }],
    ["a non-object", "90 seconds"],
  ])("rejects %s", (_description, value) => {
    expect(() => ZodDuration.parse(value)).toThrow()
  })
})

describe("zodParse", () => {
  it("returns the parsed value for valid input", () => {
    expect(zodParse(z.object({ id: z.string() }), { id: "abc" })).toEqual({ id: "abc" })
  })

  it("rethrows and logs the offending value when parsing fails", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    try {
      expect(() => zodParse(z.object({ id: z.string() }), { id: 42 })).toThrow()
      expect(consoleError).toHaveBeenCalledOnce()
      // The failing payload has to reach the log, otherwise a bad API response is undebuggable.
      expect(consoleError.mock.calls[0][0]).toContain("42")
    } finally {
      consoleError.mockRestore()
    }
  })
})
