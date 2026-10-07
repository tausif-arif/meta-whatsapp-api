import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/components/utils';
import { useAuthStore } from '@/stores/authStore';
import { CenteredSpinner } from '@/components/Spinner';
import { useProfile } from '../hooks/useAnalytics';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/api-keys', label: 'API keys', icon: KeyRound },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const tenant = useAuthStore((s) => s.tenant);
  const user = useAuthStore((s) => s.user);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const profile = useProfile();
  useEffect(() => {
    if (profile.data) setProfile(profile.data.user, profile.data.tenant);
  }, [profile.data, setProfile]);

  const signOut = () => {
    clear();
    navigate('/login');
  };

  if (profile.isLoading) {
    return (
      <div className="grid min-h-full place-items-center">
        <CenteredSpinner label="Loading workspace…" />
      </div>
    );
  }

  const initials = (tenant?.name || user?.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-canvas p-4 md:flex">
        <Brand />
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-surface-card text-ink' : 'text-muted hover:bg-surface-soft hover:text-ink',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-surface-dark p-4 text-xs text-muted-soft">
          Plan: <span className="capitalize text-canvas">{tenant?.plan ?? 'free'}</span>
          {tenant?.agentEnabled ? ' · agent connected' : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-canvas px-6">
          <div className="md:hidden">
            <Brand />
          </div>
          <div className="hidden font-display text-lg text-ink md:block">{tenant?.name}</div>

          <UserMenu initials={initials} email={user?.email ?? user?.phone ?? 'account'} onSignOut={signOut} />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary font-display text-lg text-white">
        M
      </span>
      <span className="font-display text-lg text-ink">WhatsApp API</span>
    </div>
  );
}

function UserMenu({ initials, email, onSignOut }: { initials: string; email: string; onSignOut: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2 rounded-md border border-hairline bg-canvas p-1 pr-3 outline-none hover:bg-surface-soft">
        <AvatarPrimitive.Root className="flex size-7 items-center justify-center rounded-full bg-surface-cream text-xs font-semibold text-ink">
          {initials}
        </AvatarPrimitive.Root>
        <span className="hidden text-sm text-muted sm:block">{email}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="min-w-40 rounded-md border border-hairline bg-canvas p-1 shadow-lg">
          <DropdownMenu.Item
            onSelect={onSignOut}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink outline-none hover:bg-surface-card"
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}