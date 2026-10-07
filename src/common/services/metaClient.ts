import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { requireWaAccount } from '../context/requestContext.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

const GRAPH_BASE_URL = `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;

export interface GraphError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_data?: unknown;
  fbtrace_id?: string;
}

export interface SendMessageResponse {
  messaging_product: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string; status: string }>;
}

export interface GraphPaging {
  before?: string;
  after?: string;
  cursors?: { before?: string; after?: string };
}

export interface GraphPagedResponse<T> {
  data: T[];
  paging?: GraphPaging;
}

export interface MediaObject {
  id: string;
  mime_type?: string;
  file_size?: number;
  sha256?: string;
  timestamp?: string;
  url?: string;
}

export interface ContactsCheckResponse {
  contacts: Array<{
    input: string;
    wa_id?: string;
    status?: string;
    wa_status?: string;
  }>;
}

interface GraphRequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

const mapGraphError = (status: number, error?: GraphError): ApiError => {
  const message = error?.message ?? 'Meta Graph API request failed';
  const details = error ? { code: error.code, type: error.type, fbtraceId: error.fbtrace_id } : undefined;

  if (status === 401 || status === 403) {
    return new ApiError(502, `Meta API rejected the credentials: ${message}`, details);
  }
  if (status === 429) {
    return new ApiError(429, `Meta API rate limit exceeded: ${message}`, details);
  }
  if (status === 400 || status === 404) {
    return new ApiError(status, message, details);
  }
  return new ApiError(502, message, details);
};

class GraphClient {
  private buildUrl(path: string, query?: GraphRequestOptions['query']): string {
    const base = path.startsWith('http') ? path : `${GRAPH_BASE_URL}/${path}`;
    const url = new URL(base);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private async request<T>(path: string, options: GraphRequestOptions = {}): Promise<T> {
    const account = requireWaAccount();
    const url = this.buildUrl(path, options.query);

    const response = await fetch(url, {
      method: options.method ?? 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    }).catch((error: unknown) => {
      logger.error({ url, error }, 'Could not reach Meta Graph API');
      throw ApiError.upstream('Could not reach Meta Graph API', error);
    });

    const payload = (await response.json().catch(() => null)) as
      | (Record<string, unknown> & { error?: GraphError })
      | null;

    if (!response.ok || payload?.error) {
      const graphError = payload?.error;
      logger.error({ url, status: response.status, graphError }, 'Meta Graph API request failed');
      throw mapGraphError(response.status, graphError);
    }

    return payload as T;
  }

  private requireWabaId(): string {
    const { wabaId } = requireWaAccount();
    if (!wabaId) {
      throw ApiError.unavailable('This WhatsApp account has no WABA id (template APIs unavailable)');
    }
    return wabaId;
  }

  async sendMessage(payload: Record<string, unknown>): Promise<SendMessageResponse> {
    const { phoneNumberId } = requireWaAccount();
    return this.request<SendMessageResponse>(`${phoneNumberId}/messages`, {
      body: { messaging_product: 'whatsapp', recipient_type: 'individual', ...payload },
    });
  }

  async markAsRead(messageId: string): Promise<SendMessageResponse> {
    const { phoneNumberId } = requireWaAccount();
    return this.request<SendMessageResponse>(`${phoneNumberId}/messages`, {
      body: {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
    });
  }

  async listTemplates(query?: {
    limit?: number;
    before?: string;
    after?: string;
  }): Promise<GraphPagedResponse<Record<string, unknown>>> {
    const wabaId = this.requireWabaId();
    return this.request<GraphPagedResponse<Record<string, unknown>>>(
      `${wabaId}/message_templates`,
      {
        method: 'GET',
        query: {
          limit: query?.limit,
          before: query?.before,
          after: query?.after,
          fields: 'id,name,language,status,category,sub_category,components',
        },
      },
    );
  }

  async getTemplate(templateId: string): Promise<Record<string, unknown>> {
    this.requireWabaId();
    return this.request<Record<string, unknown>>(templateId, {
      method: 'GET',
      query: { fields: 'id,name,language,status,category,sub_category,components' },
    });
  }

  async checkContacts(numbers: string[]): Promise<ContactsCheckResponse> {
    const { phoneNumberId } = requireWaAccount();
    return this.request<ContactsCheckResponse>(`${phoneNumberId}/contacts`, {
      body: { blocking: 'check', contacts: numbers },
    });
  }

  async uploadMedia(file: {
    buffer: Buffer;
    contentType: string;
    filename: string;
  }): Promise<{ id: string }> {
    const account = requireWaAccount();

    const form = new FormData();
    form.append('file', new Blob([file.buffer], { type: file.contentType }), file.filename);
    form.append('messaging_product', 'whatsapp');
    form.append('type', file.contentType);

    const response = await fetch(`${GRAPH_BASE_URL}/${account.phoneNumberId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${account.accessToken}` },
      body: form,
    }).catch((error: unknown) => {
      throw ApiError.upstream('Could not reach Meta Graph API', error);
    });

    const payload = (await response.json().catch(() => null)) as
      | (Record<string, unknown> & { error?: GraphError })
      | null;

    if (!response.ok || payload?.error) {
      throw mapGraphError(response.status, payload?.error);
    }

    return payload as { id: string };
  }

  async getMedia(mediaId: string): Promise<MediaObject> {
    return this.request<MediaObject>(mediaId, {
      method: 'GET',
      query: { fields: 'id,mime_type,file_size,sha256,timestamp,url' },
    });
  }

  async getMediaStream(url: string): Promise<{
    stream: Readable;
    contentType: string;
    contentLength: number | null;
  }> {
    const { accessToken } = requireWaAccount();

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch((error: unknown) => {
      throw ApiError.upstream('Could not download media from Meta', error);
    });

    if (!response.ok || !response.body) {
      throw ApiError.upstream(`Failed to download media (status ${response.status})`);
    }

    return {
      stream: Readable.fromWeb(response.body as WebReadableStream<Uint8Array>),
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      contentLength: response.headers.get('content-length')
        ? Number(response.headers.get('content-length'))
        : null,
    };
  }
}

export const metaClient = new GraphClient();
