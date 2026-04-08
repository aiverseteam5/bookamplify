import { z } from "zod";

export const AuthorProfileSchema = z.object({
  name: z.string().min(1).max(200),
  book_title: z.string().min(1).max(300).optional(),
  book_description: z.string().max(2000).optional(),
  genre: z.enum([
    "fiction", "history", "self-help", "business",
    "children", "cookbook", "poetry", "academic", "other",
  ]).optional(),
  sub_genre: z.string().max(100).optional(),
  target_reader: z.string().max(500).optional(),
  purchase_url: z.string().url().optional().or(z.literal("")),
  author_bio: z.string().max(1000).optional(),
  tone_preference: z.enum([
    "scholarly but accessible",
    "conversational",
    "academic",
    "storytelling",
  ]).optional(),
  launch_date: z.string().date().optional().or(z.literal("")),
});

export const ContentGenerateSchema = z.object({
  platform: z.enum(["instagram", "twitter", "linkedin", "youtube", "newsletter"]),
  topic: z.string().min(10).max(2000),
  tone: z.enum([
    "scholarly but accessible",
    "conversational",
    "academic",
    "storytelling",
  ]).optional().default("conversational"),
  skills: z.array(z.string()).max(10).default([]),
});

export const ContentIdSchema = z.object({
  id: z.string().uuid(),
});
