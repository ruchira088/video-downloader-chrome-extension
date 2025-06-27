import { z, ZodType } from "zod/v4"

export const SearchResult = <A>(zodType: ZodType<A>) =>
  z.object({
    results: z.array(zodType),
  })

export type SearchResult<A> = z.infer<ReturnType<typeof SearchResult<A>>>
