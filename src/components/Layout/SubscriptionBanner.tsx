
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CreditCard, X } from 'lucide-react';

export function SubscriptionBanner() {
  const { state } = useAuth();

  if (!state.subscription) return null;

  const isTrialing = state.subscription.status === 'TRIALING';
  const isPastDue = state.subscription.status === 'PAST_DUE';
  const daysLeft = state.subscription.trialEnd 
  ? Math.ceil((state.subscription.trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : 0;
  
  console.log("🚀 ~ SubscriptionBanner ~ daysLeft:", state.subscription.trialEnd )
  if (!isTrialing && !isPastDue) return null;

  return (
    <div className={`px-6 py-3 ${isTrialing ? 'bg-blue-50 border-b border-blue-200' : 'bg-red-50 border-b border-red-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isTrialing ? (
            <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          )}
          <span className={`text-sm font-medium ${isTrialing ? 'text-blue-800' : 'text-red-800'}`}>
            {isTrialing 
              ? `Prueba gratuita: ${daysLeft} días restantes`
              : 'Tu suscripción está vencida'
            }
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button className={`text-sm font-medium ${isTrialing ? 'text-blue-600 hover:text-blue-800' : 'text-red-600 hover:text-red-800'}`}>
            {isTrialing ? 'Actualizar Plan' : 'Renovar Suscripción'}
          </button>
          <button className={`${isTrialing ? 'text-blue-400 hover:text-blue-600' : 'text-red-400 hover:text-red-600'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}