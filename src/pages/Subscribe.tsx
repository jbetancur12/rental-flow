import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlanSelector } from '../components/Subscription/PlanSelector';

// Asume que 'plans' está en un archivo compartido
import { plans } from '../components/Auth/registerPlans'; 

export function Subscribe() {
  const { state } = useAuth();

  // El plan seleccionado por defecto es el que el usuario eligió al registrarse
  const [selectedPlan, setSelectedPlan] = useState(state.subscription?.planId || 'plan-professional');

  const handleSubscribe = () => {
      // Aquí iría la lógica para redirigir al checkout de Stripe
      // con el 'selectedPlan'
      alert(`Iniciando pago para el plan: ${selectedPlan}`);
  };

  return (
    <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-red-600">Tu Período de Prueba ha Terminado</h1>
            <p className="text-slate-600 mt-2 mb-8">Para continuar usando RentFlow, por favor elige un plan.</p>

            <PlanSelector 
                plans={plans}
                selectedPlan={selectedPlan}
                onSelectPlan={setSelectedPlan}
            />

            <button onClick={handleSubscribe} className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                Continuar al Pago
            </button>
        </div>
    </div>
  );
}