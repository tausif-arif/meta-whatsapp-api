import type { BadgeProps } from '@/components/Badge';

export const STATUS_META: Record<
  string,
  { tone: NonNullable<BadgeProps['tone']>; label: string }
> = {
  received: { tone: 'neutral', label: 'Received' },
  queued: { tone: 'warning', label: 'Queued' },
  sent: { tone: 'muted', label: 'Sent' },
  delivered: { tone: 'success', label: 'Delivered' },
  read: { tone: 'coral', label: 'Read' },
  failed: { tone: 'error', label: 'Failed' },
};

export const statusMeta = (status: string): { tone: BadgeProps['tone']; label: string } =>
  STATUS_META[status] ?? { tone: 'muted', label: status };

export const CHANNEL_LABEL: Record<string, string> = {
  api: 'API',
  agent: 'Agent',
  webhook: 'Webhook',
};

export const channelLabel = (source: string): string => CHANNEL_LABEL[source] ?? source;

export const TYPE_LABEL: Record<string, string> = {
  text: 'Text',
  template: 'Template',
  interactive: 'Interactive',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  document: 'Document',
  location: 'Location',
  contacts: 'Contacts',
};

export const messageTypeLabel = (type: string): string => TYPE_LABEL[type] ?? type;

export const directionLabel = (direction: string): string =>
  direction === 'inbound' ? 'Inbound' : 'Outbound';

export const DISTINCT_STATUSES = Object.keys(STATUS_META);

export const DISTINCT_TYPES = Object.keys(TYPE_LABEL);