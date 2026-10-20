import { z } from "zod";

const iconNames = ["arrow-up-right", "triangle", "box"] as const;
export const tones = ["blue", "pink", "orange", "cyan", "yellow"] as const;

export const topicIconSchema = z.union([
  z.object({ text: z.string().min(1).max(3) }),
  z.object({ name: z.enum(iconNames) }),
]);

export type IconName = (typeof iconNames)[number];
export type Tone = (typeof tones)[number];
export type TopicIconData = z.infer<typeof topicIconSchema>;

export interface TopicLook {
  icon: TopicIconData;
  tone: Tone;
}
