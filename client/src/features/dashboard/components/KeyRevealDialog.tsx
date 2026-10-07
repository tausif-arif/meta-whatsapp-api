import { Copy } from 'lucide-react';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { copyText } from '@/lib/clipboard';

export function KeyRevealDialog({
  open,
  onOpenChange,
  apiKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string | null;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="API key created"
      description="Shown only once — store it somewhere safe. You cannot view it again."
      footer={
        <Button
          onClick={() => apiKey && copyText(apiKey, 'API key copied')}
          icon={<Copy className="size-4" />}
        >
          Copy key
        </Button>
      }
    >
      {apiKey ? (
        <div className="rounded-md bg-surface-dark p-4 font-mono text-sm break-all text-teal">
          {apiKey}
        </div>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        Send it as the <code className="font-mono">X-API-Key</code> header when calling your messaging
        endpoints.
      </p>
    </Dialog>
  );
}