import { Badge } from '@/components/Badge';
import { statusMeta } from '../utils/format';

export function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status);
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}