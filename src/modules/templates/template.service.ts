import { metaClient } from '../../common/services/metaClient.js';
import { normalizeTemplate, normalizeTemplates } from './template.utils.js';
import type { ListTemplatesQuery, TemplateSummary } from './template.types.js';

export const templateService = {
  async list(query: ListTemplatesQuery): Promise<{
    templates: TemplateSummary[];
    paging: Record<string, unknown> | null;
  }> {
    const page = await metaClient.listTemplates(query);
    return {
      templates: normalizeTemplates(page.data ?? []),
      paging: (page.paging as Record<string, unknown> | undefined) ?? null,
    };
  },

  async getById(templateId: string): Promise<TemplateSummary> {
    const raw = await metaClient.getTemplate(templateId);
    return normalizeTemplate(raw);
  },
};
