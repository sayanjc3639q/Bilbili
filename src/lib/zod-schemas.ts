import { z } from "zod";

export const SubtopicIdRegex = /^[0-9a-zA-Z]{6}$/;

export const SubtitleBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("subtitle"),
  text: z.string().min(1, "Subtitle text cannot be empty"),
  level: z
    .union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .optional()
    .default(2),
});

export const ParagraphBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("paragraph"),
  text: z.string().min(1, "Paragraph text cannot be empty"),
});

export const BulletListBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("bullet_list"),
  items: z.array(z.string()).min(1, "At least one item required"),
});

export const NumberedListBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("numbered_list"),
  items: z.array(z.string()).min(1, "At least one item required"),
});

export const TableBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("table"),
  hasHeader: z.boolean(),
  rows: z.array(z.array(z.string())),
});

export const ImageBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("image"),
  url: z.string().min(1, "Image URL is required"),
  alt: z.string().min(1, "Image alt text is required for accessibility"),
  caption: z.string().optional(),
});

export const CodeBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("code"),
  language: z.string().default("typescript"),
  code: z.string().min(1, "Code content is required"),
  filename: z.string().optional(),
});

export const CalloutBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("callout"),
  kind: z.enum(["note", "warning"]),
  title: z.string().optional(),
  text: z.string().min(1, "Callout text cannot be empty"),
});

export const EquationBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("equation"),
  formula: z.string().min(1, "Equation formula cannot be empty"),
  isBlock: z.boolean().default(true),
});

export const LinkBlockSchema = z.object({
  id: z.string().min(1),
  type: z.literal("link"),
  url: z.string().min(1, "URL is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const BlockSchema = z.discriminatedUnion("type", [
  SubtitleBlockSchema,
  ParagraphBlockSchema,
  BulletListBlockSchema,
  NumberedListBlockSchema,
  TableBlockSchema,
  ImageBlockSchema,
  CodeBlockSchema,
  CalloutBlockSchema,
  EquationBlockSchema,
  LinkBlockSchema,
]);

export const ReferenceItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL"),
});

export const BlogFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(180, "Title is too long"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  subtopicId: z.string().regex(SubtopicIdRegex, "Subtopic ID must be exactly 6 alphanumeric characters"),
  blocks: z.array(BlockSchema).min(1, "At least one block is required"),
  references: z.array(ReferenceItemSchema).default([]),
  acknowledgement: z.string().optional(),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().max(300, "Excerpt is too long").optional(),
});

export const TopicFormSchema = z.object({
  name: z.string().min(2, "Topic name must be at least 2 characters").max(100),
  slug: z.string().min(2, "Topic slug must be at least 2 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  parentId: z.string().nullable().optional(),
});

export const AdminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
