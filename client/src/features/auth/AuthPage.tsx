import type { FormEvent } from 'react';
import { useState } from 'react';
import { Copy, KeyRound, Mail, Phone } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/toastStore';
import { cn } from '@/components/utils';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Field } from '@/components/Field';
import { Spinner } from '@/components/Spinner';
import { useLogin, useSignup } from './hooks/useAuth';

type Mode = 'login' | 'signup';

const copyKey = async (key: string): Promise<void> => {
  await navigator.clipboard.writeText(key);
  toast.success('API key copied');
};

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const login = useLogin();
  const signup = useSignup();
  const busy = login.isPending || signup.isPending;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === 'login') {
      if (!identity || !password) return setError('Enter your email/phone and password.');
      login.mutate(
        { identity, password },
        { onError: (err) => setError(err instanceof ApiError ? err.message : 'Sign in failed') },
      );
      return;
    }

    if (!(email || phone)) return setError('Provide an email or a phone number.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    signup.mutate(
      { name: name.trim() || undefined, email: email.trim() || undefined, phone: phone.trim() || undefined, password },
      {
        onSuccess: (data) => setRevealedKey(data.apiKey),
        onError: (err) => setError(err instanceof ApiError ? err.message : 'Sign up failed'),
      },
    );
  };

  return (
    <div className="grid min-h-full place-items-center p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-hairline bg-canvas shadow-sm md:grid-cols-2">
        <BrandPanel />

        <div className="p-8">
          <Tabs mode={mode} onChange={switchMode} />

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            {mode === 'signup' ? (
              <Field
                label="Company name"
                placeholder="Acme Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : null}

            {mode === 'signup' ? (
              <>
                <Field label="Email" type="email" placeholder="you@company.com" icon={<Mail className="size-4" />} value={email} onChange={(e) => setEmail(e.target.value)} />
                <Field label="Phone" placeholder="+1 555 000 1234" icon={<Phone className="size-4" />} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </>
            ) : (
              <Field
                label="Email or phone"
                placeholder="you@company.com"
                icon={<KeyRound className="size-4" />}
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
              />
            )}

            <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

            {error ? <p className="text-sm text-error">{error}</p> : null}

            <Button type="submit" disabled={busy}>
              {busy ? <Spinner className="text-white" /> : null}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>
      </div>

      <Dialog
        open={Boolean(revealedKey)}
        onOpenChange={(open) => {
          if (!open) setRevealedKey(null);
        }}
        title="Your API key"
        description="Shown only once. Store it somewhere safe — you cannot view it again."
        footer={
          <Button
            onClick={() => revealedKey && copyKey(revealedKey)}
            icon={<Copy className="size-4" />}
          >
            Copy & go to dashboard
          </Button>
        }
      >
        <div className="rounded-md bg-surface-dark p-4 font-mono text-sm break-all text-teal">
          {revealedKey}
        </div>
        <p className="mt-3 text-xs text-muted">
          Use it with <code className="font-mono">X-API-Key</code> to send OTPs and messages. You can
          create more keys in the dashboard.
        </p>
      </Dialog>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="hidden flex-col justify-between bg-surface-dark p-8 text-canvas md:flex">
      <div>
        <p className="font-mono text-sm text-teal">WhatsApp Cloud API</p>
        <h2 className="mt-4 text-3xl leading-tight">
          One API key for OTPs, promotions and agent conversations — at a fraction of the big-name price.
        </h2>
      </div>
      <ul className="mt-8 flex flex-col gap-2 text-sm">
        <li className="text-muted-soft">— No Meta setup, no Meta business verification</li>
        <li className="text-muted-soft">— Live delivery & read tracking</li>
        <li className="text-muted-soft">— Connect your AI agent to answer customers</li>
      </ul>
    </div>
  );
}

function Tabs({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  const base = 'rounded-md px-4 py-2 text-sm font-medium transition-colors';
  const tabs: { id: Mode; label: string }[] = [
    { id: 'login', label: 'Sign in' },
    { id: 'signup', label: 'Create account' },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-surface-card p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(base, mode === tab.id ? 'bg-canvas text-ink shadow-sm' : 'text-muted')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}