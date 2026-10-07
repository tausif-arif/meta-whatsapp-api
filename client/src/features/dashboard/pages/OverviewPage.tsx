import { MessageCircle, TrendingDown, TrendingUp, UserPlus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Card, CardHeader } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { CenteredSpinner } from '@/components/Spinner';
import { StatCard } from '@/components/StatCard';
import { formatNumber } from '@/lib/formatNumber';
import { fromDaysAgo } from '@/lib/format';
import { useSummary, useTimeseries, useTopContacts } from '../hooks/useAnalytics';
import { PageHeader } from '../components/PageHeader';
import { MessagesChart } from '../components/MessagesChart';

const RANGE_DAYS = 14;
const RANGE_FROM = fromDaysAgo(RANGE_DAYS);

export default function OverviewPage() {
  const summary = useSummary(RANGE_FROM);
  const timeseries = useTimeseries('day', RANGE_DAYS);
  const topContacts = useTopContacts(8);

  if (summary.isLoading) return <CenteredSpinner />;

  const data = summary.data;
  const hasMessages = (data?.totals.total ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`Message activity over the last ${RANGE_DAYS} days.`}
      />

      {!hasMessages ? (
        <EmptyState
          title="No messages yet"
          description="As soon as you send your first OTP or message with your API key, usage appears here. Incoming customer messages also count."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard
              label="Outbound"
              value={formatNumber(data?.totals.outbound ?? 0)}
              icon={<ArrowUpRight className="size-4" />}
              sub={`${Math.round(((data?.totals.outbound ?? 0) / (data?.totals.total ?? 0)) * 100)}% of traffic`}
            />
            <StatCard
              label="Inbound"
              value={formatNumber(data?.totals.inbound ?? 0)}
              icon={<ArrowDownLeft className="size-4" />}
              sub="Customer messages"
            />
            <StatCard
              label="Delivered rate"
              value={`${data?.rates.deliveredRate ?? 0}%`}
              icon={<TrendingUp className="size-4 text-success" />}
              sub="sent + delivered + read"
            />
            <StatCard
              label="Read rate"
              value={`${data?.rates.readRate ?? 0}%`}
              icon={<MessageCircle className="size-4" />}
              sub="of outbound read"
            />
            <StatCard
              label="Failed"
              value={formatNumber(data?.byStatus.failed ?? 0)}
              icon={<TrendingDown className="size-4 text-error" />}
              sub={`${data?.rates.failedRate ?? 0}% failure rate`}
            />
          </div>

          <Card>
            <CardHeader
              title="Message volume"
              description="Outbound vs inbound per day"
              action={
                <div className="flex gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-primary" /> Outbound
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-teal" /> Inbound
                  </span>
                </div>
              }
            />
            {timeseries.isLoading ? (
              <div className="py-16 text-center">
                <Spinner />
              </div>
            ) : (
              <MessagesChart data={timeseries.data ?? []} />
            )}
          </Card>

          <Card>
            <CardHeader title="Top contacts" description="Most active peers on your number" />
            {!topContacts.data?.length ? (
              <p className="py-8 text-center text-sm text-muted">No contacts yet.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {topContacts.data.map(({ peer, value }) => (
                  <li key={peer} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <span className="rounded-full bg-surface-soft p-1.5">
                        <UserPlus className="size-3.5 text-muted" />
                      </span>
                      {peer}
                    </span>
                    <Badge tone="neutral">
                      {formatNumber(value)} messages
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}