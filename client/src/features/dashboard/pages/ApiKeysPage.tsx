import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Dialog } from '@/components/Dialog';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/Field';
import { CenteredSpinner } from '@/components/Spinner';
import { formatRelative } from '@/lib/format';
import { toast } from '@/stores/toastStore';
import { PageHeader } from '../components/PageHeader';
import { KeyRevealDialog } from '../components/KeyRevealDialog';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../hooks/useApiKeys';

export default function ApiKeysPage() {
  const [label, setLabel] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const keys = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const generate = () => {
    createKey.mutate(label.trim() || 'default', {
      onSuccess: (data) => {
        setDialogOpen(false);
        setLabel('');
        setRevealedKey(data.apiKey);
      },
      onError: (err) => toast.error('Could not create key', err.message),
    });
  };

  const revoke = (id: string, label: string) => {
    if (!window.confirm(`Revoke API key "${label}"? This can't be undone.`)) return;
    revokeKey.mutate(id, {
      onError: (err) => toast.error('Could not revoke key', err.message),
    });
  };

  const activeCount = keys.data?.filter((key) => !key.revokedAt).length ?? 0;

  return (
    <div>
      <PageHeader
        title="API keys"
        description={`${activeCount} active key${activeCount === 1 ? '' : 's'}. Keys authenticate your apps — keep them secret.`}
        action={
          <Button onClick={() => setDialogOpen(true)} icon={<Plus className="size-4" />}>
            Generate key
          </Button>
        }
      />

      {keys.isLoading ? (
        <CenteredSpinner />
      ) : !keys.data?.length ? (
        <EmptyState
          title="No API keys"
          description="Generate a key to start sending messages from your apps."
        />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-hairline">
            {keys.data.map((key) => {
              const revoked = Boolean(key.revokedAt);
              return (
                <li key={key.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-ink">{key.keyPrefix}…</span>
                      {revoked ? (
                        <Badge tone="error">Revoked</Badge>
                      ) : (
                        <Badge tone="success">Active</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {key.label} · created {formatRelative(key.createdAt)}
                      {key.lastUsedAt ? ` · last used ${formatRelative(key.lastUsedAt)}` : ' · never used'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={revoked}
                    onClick={() => revoke(key.id, key.label)}
                    icon={<Trash2 className="size-4 text-muted" />}
                  >
                    Revoke
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Generate API key"
        description="A new key for your tenant. You'll only see it once."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generate} disabled={createKey.isPending}>
              {createKey.isPending ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <Field
          label="Label"
          placeholder="e.g. production-app"
          hint="A friendly name to recognize this key."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </Dialog>

      <KeyRevealDialog open={Boolean(revealedKey)} onOpenChange={(open) => { if (!open) setRevealedKey(null); }} apiKey={revealedKey} />
    </div>
  );
}