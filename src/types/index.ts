export type BlockType =
  | 'subtitle'
  | 'paragraph'
  | 'bullet_list'
  | 'numbered_list'
  | 'table'
  | 'image'
  | 'code'
  | 'callout'
  | 'equation';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface SubtitleBlock extends BaseBlock {
  type: 'subtitle';
  text: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
}

export interface BulletListBlock extends BaseBlock {
  type: 'bullet_list';
  items: string[];
}

export interface NumberedListBlock extends BaseBlock {
  type: 'numbered_list';
  items: string[];
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  hasHeader: boolean;
  rows: string[][];
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  language: string;
  code: string;
  filename?: string;
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  kind: 'note' | 'warning';
  title?: string;
  text: string;
}

export interface EquationBlock extends BaseBlock {
  type: 'equation';
  formula: string;
  isBlock: boolean;
}

export type Block =
  | SubtitleBlock
  | ParagraphBlock
  | BulletListBlock
  | NumberedListBlock
  | TableBlock
  | ImageBlock
  | CodeBlock
  | CalloutBlock
  | EquationBlock;

export interface ReferenceItem {
  label: string;
  url: string;
}

export type BlogStatus = 'draft' | 'published';

export interface Blog {
  id: string;
  title: string;
  slug: string;
  subtopicId: string; // 6-character unique ID
  topicPath: string[]; // [rootTopicId, ..., subtopicId]
  blocks: Block[];
  references: ReferenceItem[];
  acknowledgement?: string;
  status: BlogStatus;
  keywords: string[];
  excerpt: string;
  readingTime: number; // in minutes
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Topic {
  id: string; // 6-char ID for subtopics, slug or string for main topics
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  ancestors: string[]; // Array of IDs from root to immediate parent
  blogCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicNode extends Topic {
  children: TopicNode[];
}

export interface TopicTreeDoc {
  updatedAt: string;
  roots: TopicNode[];
}

export interface SearchIndexItem {
  id: string;
  title: string;
  slug: string;
  subtopicId: string;
  topicPathNames: string[];
  keywords: string[];
  excerpt: string;
  readingTime: number;
  publishedAt?: string;
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}
