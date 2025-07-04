import { Check } from "lucide-react";
import { SubscriptionPlan } from "../../types/auth";



type PlanSelectorProps = {
  plans: SubscriptionPlan[];
  selectedPlan: string | number;
  onSelectPlan: (planId: string) => void;
};

export function PlanSelector({ plans, selectedPlan, onSelectPlan }: PlanSelectorProps) {
    
    return (
          <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-2">Elige tu Plan</h2>
                  <p className="text-slate-600">Comienza con 14 días gratis, cancela cuando quieras</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan:any) => (
                    <div
                      key={plan.id}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => onSelectPlan(plan.id)}
                    >
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                        <p className="text-slate-600 text-sm mt-1">{plan.description}</p>
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                          <span className="text-slate-600">/mes</span>
                        </div>
                      </div>

                      <ul className="space-y-2">
                        {plan.features.map((feature:any, index:any) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-emerald-600 mr-2" />
                            <span className="text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {selectedPlan === plan.id && (
                        <div className="mt-4 p-2 bg-blue-100 rounded-lg text-center">
                          <span className="text-blue-800 text-sm font-medium">Plan Seleccionado</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

       
              </div>
    )
}