import { z } from "zod/v4"

export enum MessageType {
  DownloadVideo = "DownloadVideo",
}

export const DownloadVideo = z.object({
  type: z.enum(MessageType).default(MessageType.DownloadVideo),
  videoUrl: z.url(),
})

export type DownloadVideo = z.infer<typeof DownloadVideo>

export const Message = z.discriminatedUnion("type", [DownloadVideo])

export type Message = z.infer<typeof Message>
