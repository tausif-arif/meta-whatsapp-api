import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Select, type SelectOption } from '@/components/Select';
import { CenteredSpinner } from '@/components/Spinner';
import { formatDateTime } from '@/lib/format';
import { useMessages } from '../hooks/useMessages';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { DISTINCT_STATUSES, DISTINCT_TYPES, directionLabel, messageTypeLabel } from '../utils/format';

const DIRECTION_OPTIONS: SelectOption[] = [
  { value: '', label: 'All directions' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'inbound', label: 'Inbound' },
];

const TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All types' },
  ...DISTINCT_TYPES.map((type) => ({ value: type, label: messageTypeLabel(type) })),
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All statuses' },
  ...DISTINCT_STATUSES.map((status) => ({ value: status, label: status })),
];

export default function MessagesPage() {
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  const query = useMessages({ page, limit: 20, direction: direction || undefined, type: type || undefined, status: status || undefined });

  const resetPage = (setter: (value: string) => void) => (value: string) => {
    setPage(1);
    setter(value);
  };

  return (
    <div>
      <PageHeader title="Messages" description="Your message history across API, agent and inbound traffic." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={direction} onValueChange={resetPage(setDirection)} options={DIRECTION_OPTIONS} ariaLabel="Filter by direction" className="w-40" />
        <Select value={type} onValueChange={resetPage(setType)} options={TYPE_OPTIONS} ariaLabel="Filter by type" className="w-40" />
        <Select value={status} onValueChange={resetPage(setStatus)} options={STATUS_OPTIONS} ariaLabel="Filter by status" className="w-40" />
      </div>

      {query.isLoading ? (
        <CenteredSpinner label="Loading messages…" />
      ) : !query.data?.messages.length ? (
        <EmptyState
          title="No messages match"
          description="Try clearing filters, or wait for your first send."
          action={
            <button className="text-sm font-medium text-primary hover:underline" onClick={() => { setDirection(''); setType(''); setStatus(''); setPage(1); }}>
              Clear filters
            </button>
          }
        />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Peer</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {query.data.messages.map((message) => (
                  <tr key={message.id} className="text-ink">
                    <td className="px-4 py-3">{directionLabel(message.direction)}</td>
                    <td className="px-4 py-3">{messageTypeLabel(message.messageType)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{message.peer}</td>
                    <td className="px-4 py-3 capitalize">{message.source}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={message.status} />
                      {message.status === 'failed' && message.error ? (
                        <p className="mt-1 max-w-40 text-xs text-error">{message.error}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted">
                      {formatDateTime(message.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={query.data.page} totalPages={query.data.totalPages} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between border-t border-hairline px-4 py-3 text-sm text-muted">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          className="inline-flex size-8 items-center justify-center rounded-md border border-hairline bg-canvas hover:bg-surface-soft disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4 text-ink" />
        </button>
        <button
          className="inline-flex size-8 items-center justify-center rounded-md border border-hairline bg-canvas hover:bg-surface-soft disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4 text-ink" />
        </button>
      </div>
    </div>
  );
}