import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { shortDate } from '@/lib/format';
import type { TimeseriesPoint } from '../types/dashboard';

interface BucketRow {
  bucket: string;
  outbound: number;
  inbound: number;
}

const buildBuckets = (points: TimeseriesPoint[]): BucketRow[] => {
  const map = new Map<string, BucketRow>();
  for (const point of points) {
    const row = map.get(point.bucket) ?? { bucket: point.bucket, outbound: 0, inbound: 0 };
    if (point.direction === 'inbound') row.inbound += point.value;
    else row.outbound += point.value;
    map.set(point.bucket, row);
  }
  return [...map.values()];
};

export function MessagesChart({ data }: { data: TimeseriesPoint[] }) {
  const buckets = useMemo(() => buildBuckets(data), [data]);

  if (buckets.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted">
        No message volume yet — your chart appears here once you send messages.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={buckets} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barSize={16}>
        <XAxis
          dataKey="bucket"
          tickFormatter={shortDate}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-muted-soft)', fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-muted-soft)', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: 'var(--color-surface-soft)' }}
          contentStyle={{
            background: 'var(--color-canvas)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 8,
          }}
        />
        <Bar dataKey="outbound" name="Outbound" stackId="v" fill="var(--color-primary)" />
        <Bar dataKey="inbound" name="Inbound" stackId="v" fill="var(--color-teal)" />
      </BarChart>
    </ResponsiveContainer>
  );
}