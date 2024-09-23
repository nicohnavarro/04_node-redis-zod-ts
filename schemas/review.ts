import { z } from "zod";

export const ReviewSchema = z.object({
  review: z.string().min(10),
  rating: z.number().min(1).max(5),
});

export type Review = z.infer<typeof ReviewSchema>;
