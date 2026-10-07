import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { MessageCircle, PhoneOff } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { CenteredSpinner } from '@/components/Spinner';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
import { dashboardApi } from '../api/dashboard.api';
import { PageHeader } from '../components/PageHeader';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);

  const accounts = useQuery({ queryKey: ['wa-accounts'], queryFn: dashboardApi.waAccounts });
  const connectLink = useQuery({ queryKey: ['connect-link'], queryFn: dashboardApi.connectLink });

  const connect = () => {
    const link = connectLink.data;
    if (!link) return;
    if (link.status === 'ready' && link.url) {
      window.open(link.url, '_blank', 'noopener');
    } else {
      window.alert(link.message ?? 'WhatsApp connection is not enabled yet.');
    }
  };

  if (accounts.isLoading) return <CenteredSpinner />;

  return (
    <div>
      <PageHeader title="Settings" description="Your account, plan and WhatsApp connections." />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Account" description="The identity you use to sign in." />
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <FieldLine label="Email" value={user?.email ?? '—'} />
            <FieldLine label="Phone" value={user?.phone ?? '—'} />
            <FieldLine label="Tenant" value={tenant?.name ?? '—'} />
            <FieldLine
              label="Plan"
              value={
                <span className="flex items-center gap-2">
                  <Badge tone="coral">{tenant?.plan ?? 'free'}</Badge>
                </span>
              }
            />
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="WhatsApp numbers"
            description="Numbers connected to your tenant. Inbound messages to these numbers are routed to you."
            action={
              <Button variant="secondary" size="sm" onClick={connect}>
                Connect WhatsApp
              </Button>
            }
          />
          {!accounts.data?.length ? (
            <EmptyState
              title="No number connected yet"
              description="Click “Connect WhatsApp” to link a number to this tenant. No Meta setup on your side."
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {accounts.data.map((account) => (
                <li key={account.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-surface-soft p-2">
                      <MessageCircle className="size-4 text-muted" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {account.displayName ?? account.phoneNumber ?? account.phoneNumberId}
                      </p>
                      {account.phoneNumber ? (
                        <p className="font-mono text-xs text-muted">{account.phoneNumber}</p>
                      ) : null}
                    </div>
                  </div>
                  {account.isActive ? (
                    <Badge tone="success">Connected</Badge>
                  ) : (
                    <Badge tone="warning">Inactive</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
          {connectLink.data?.status === 'not_configured' ? (
            <p className="mt-4 flex items-start gap-2 rounded-md bg-surface-soft p-3 text-xs text-muted">
              <PhoneOff className="mt-0.5 size-4 shrink-0 text-muted-soft" />
              {connectLink.data.message}
            </p>
          ) : null}
        </Card>

        <Card>
          <CardHeader title="Agent routing" description="How messages flow to your AI agent." />
          <p className="text-sm leading-relaxed text-body">
            {tenant?.agentEnabled
              ? 'Your agent webhook is configured. Inbound WhatsApp messages are POSTed to your agent and its reply is sent back automatically.'
              : 'No agent webhook configured for this tenant yet. When you hook up your agent backend, point its webhook URL here and customer messages will be routed to it automatically.'}
          </p>
          <p className="mt-3 text-xs text-muted-soft">
            Last profile update {formatDate(user?.createdAt)}
          </p>
        </Card>
      </div>
    </div>
  );
}

function FieldLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}