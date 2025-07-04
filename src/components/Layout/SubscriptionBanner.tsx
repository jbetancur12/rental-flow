import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CreditCard, FlaskConical } from 'lucide-react';
import { useMemo } from 'react';
import { isPast } from 'date-fns';

export function SubscriptionBanner() {
  const { state } = useAuth();
  const { subscription } = state;

  // 1. Calculamos el estado relevante del banner usando useMemo
  const bannerState = useMemo(() => {
    if (!subscription) return null;

    if (subscription.status === 'DEMO') {
      return 'DEMO';
    }
    
    const isTrialExpired = subscription.trialEnd && isPast(new Date(subscription.trialEnd));
    if (subscription.status === 'TRIALING' && !isTrialExpired) {
      return 'TRIALING';
    }

    if (subscription.status === 'PAST_DUE' || (subscription.status === 'TRIALING' && isTrialExpired)) {
      return 'EXPIRED';
    }

    return null; // Para 'ACTIVE' o 'CANCELED', no mostramos nada
  }, [subscription]);
  
  // Cálculo de días restantes (solo para 'TRIALING')
  const daysLeft = useMemo(() => {
    if (bannerState !== 'TRIALING' || !subscription?.trialEnd) return 0;
    const diffTime = new Date(subscription.trialEnd).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [bannerState, subscription]);

  // Si no hay un estado que requiera un banner, no renderizamos nada.
  if (!bannerState) return null;

  // 2. Objeto de configuración para cada tipo de banner
  const bannerConfig = {
    TRIALING: {
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      icon: <CreditCard className="w-5 h-5 text-blue-600 mr-3" />,
      message: `Te quedan ${daysLeft} días de prueba.`,
      actionText: 'Actualizar Plan'
    },
    EXPIRED: {
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      icon: <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />,
      message: 'Tu acceso ha expirado. Elige un plan para continuar.',
      actionText: 'Renovar Suscripción'
    },
    DEMO: {
      bgColor: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-800',
      icon: <FlaskConical className="w-5 h-5 text-purple-600 mr-3" />,
      message: 'Estás navegando en una cuenta de demostración.',
      actionText: 'Ver Planes'
    }
  };

  const config = bannerConfig[bannerState];

  return (
    <div className={`px-6 py-3 border-b ${config.bgColor}`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          {config.icon}
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.message}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button className={`text-sm font-bold underline ${config.textColor}`}>
            {config.actionText}
          </button>
        </div>
      </div>
    </div>
  );
}