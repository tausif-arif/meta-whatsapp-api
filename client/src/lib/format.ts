import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (value: string | Date | null | undefined): string =>
  value ? dayjs(value).format('MMM D, YYYY') : '—';

export const formatDateTime = (value: string | Date | null | undefined): string =>
  value ? dayjs(value).format('MMM D, YYYY h:mm A') : '—';

export const formatRelative = (value: string | Date | null | undefined): string =>
  value ? dayjs(value).fromNow() : '—';

export const fromDaysAgo = (days: number): string =>
  dayjs().subtract(days, 'day').toISOString();

export const shortDate = (value: string): string => dayjs(value).format('MMM D');