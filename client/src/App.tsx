import type { ReactNode } from 'react';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AuthPage from '@/features/auth/AuthPage';
import DashboardLayout from '@/features/dashboard/pages/DashboardLayout';
import OverviewPage from '@/features/dashboard/pages/OverviewPage';
import MessagesPage from '@/features/dashboard/pages/MessagesPage';
import ApiKeysPage from '@/features/dashboard/pages/ApiKeysPage';
import SettingsPage from '@/features/dashboard/pages/SettingsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function RequireGuest({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/" replace /> : children;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <RequireGuest><AuthPage /></RequireGuest>,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'api-keys', element: <ApiKeysPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}