import { DateTime, Duration } from "luxon"
import { z } from "zod/v4"

export const ZodDateTime = z.iso.datetime({ offset: true }).transform(isoString => DateTime.fromISO(isoString))

export const ZodDuration = z.object({ length: z.number(), unit: z.string() })
  .transform(({ length, unit }) => Duration.fromObject({ [unit]: length }))

export const zodParse = <A>(type: z.ZodType<A>, value: unknown): A => {
  try {
    return type.parse(value)
  } catch (error) {
    console.error(error)
    throw error
  }
}