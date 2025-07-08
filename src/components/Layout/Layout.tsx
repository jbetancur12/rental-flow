
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SubscriptionBanner } from './SubscriptionBanner';
import { Suspense } from 'react';

export function Layout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SubscriptionBanner />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400">Cargando...</div>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}