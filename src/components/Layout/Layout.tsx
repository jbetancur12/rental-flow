import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SubscriptionBanner } from './SubscriptionBanner';

export function Layout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SubscriptionBanner />
        <Outlet />
      </div>
    </div>
  );
}