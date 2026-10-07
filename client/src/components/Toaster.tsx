import * as Toast from '@radix-ui/react-toast';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const remove = useToastStore((state) => state.remove);

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((item) => (
        <Toast.Root
          key={item.id}
          onOpenChange={(open) => {
            if (!open) remove(item.id);
          }}
          duration={5000}
          className="flex items-start gap-3 rounded-lg border border-hairline bg-canvas p-4 shadow-lg"
        >
          {item.kind === 'success' ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          ) : (
            <XCircle className="mt-0.5 size-5 shrink-0 text-error" />
          )}
          <div className="min-w-0">
            <Toast.Title className="text-sm font-medium text-ink">{item.title}</Toast.Title>
            {item.description ? (
              <Toast.Description className="mt-0.5 break-all text-xs text-muted">
                {item.description}
              </Toast.Description>
            ) : null}
          </div>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2" />
    </Toast.Provider>
  );
}