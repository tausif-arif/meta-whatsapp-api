import type { TemplateSummary } from './template.types.js';

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

export const normalizeTemplate = (raw: Record<string, unknown>): TemplateSummary => {
  const language = raw.language;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    language:
      typeof language === 'string'
        ? language
        : String(asRecord(language).code ?? ''),
    status: String(raw.status ?? ''),
    category: String(raw.category ?? ''),
    subCategory: String(raw.sub_category ?? raw.subCategory ?? ''),
    components: Array.isArray(raw.components) ? raw.components : [],
  };
};

export const normalizeTemplates = (raw: Record<string, unknown>[]): TemplateSummary[] =>
  raw.map(normalizeTemplate);
