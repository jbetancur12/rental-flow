
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SubscriptionBanner } from './SubscriptionBanner';
import { Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMemo } from 'react';

function useSubscriptionBannerVisible() {
  const { state } = useAuth();
  const { subscription } = state;
  return useMemo(() => {
    if (!subscription) return false;
    if (subscription.status === 'DEMO') return true;
    const isTrialExpired = subscription.trialEnd && new Date(subscription.trialEnd) < new Date();
    if (subscription.status === 'TRIALING' && !isTrialExpired) return true;
    if (subscription.status === 'PAST_DUE' || (subscription.status === 'TRIALING' && isTrialExpired)) return true;
    return false;
  }, [subscription]);
}

export function Layout() {
  const bannerVisible = useSubscriptionBannerVisible();
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col overflow-hidden ${bannerVisible ? 'pt-16 md:pt-14' : ''}`}
      >
        <SubscriptionBanner />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400">Cargando...</div>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}