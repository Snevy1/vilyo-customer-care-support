import { ProductSectionProps } from "@/@types/types";

export function ProductSection({ title, description, icon, plans, selectedPlanId, onSelect, color }: ProductSectionProps) {
  if (plans.length === 0) return null;
  
  return (
    <div className='border border-white/5 rounded-2xl p-6'>
      <div className='flex items-center gap-3 mb-6'>
        <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400`}>
          {icon}
        </div>
        <div>
          <h4 className='text-xl font-medium text-white'>{title}</h4>
          <p className='text-zinc-500 text-sm'>{description}</p>
        </div>
      </div>
      
      <div className='space-y-4'>
        {plans.map((plan) => (
          <div
            key={plan.plan_id}
            className={`p-4 rounded-xl border cursor-pointer transition-colors ${
              selectedPlanId === plan.plan_id
                ? `border-${color}-500 bg-${color}-500/10`
                : 'border-white/5 hover:border-white/10 hover:bg-white/5'
            }`}
            onClick={() => onSelect(plan.plan_id)}
          >
            <div className='flex justify-between items-center mb-2'>
              <span className='font-medium text-white'>{plan.display_name}</span>
              <span className='font-medium text-white'>
                ${plan.price}<span className='text-zinc-400 text-sm'>/mo</span>
              </span>
            </div>
            <p className='text-zinc-500 text-sm mb-3'>{plan.description}</p>
            <div className='text-xs text-zinc-400'>
              {plan.features.slice(0, 2).map((f, i) => (
                <span key={i} className='mr-3'>• {f}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}