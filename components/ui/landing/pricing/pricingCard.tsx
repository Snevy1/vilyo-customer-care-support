import { PricingCardProps } from "@/@types/types";
import { Check } from "lucide-react";

export function PricingCard({ plan, isSelected, onSelect, highlightColor = 'indigo', showSavings }: PricingCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-500 text-indigo-400 border-indigo-500',
    blue: 'bg-blue-500 text-blue-400 border-blue-500',
    green: 'bg-green-500 text-green-400 border-green-500',
    purple: 'bg-purple-500 text-purple-400 border-purple-500',
    yellow: 'bg-yellow-500 text-yellow-400 border-yellow-500'
  };

  return (
    <div className={`p-8 relative overflow-hidden rounded-3xl border ${
      isSelected 
        ? `border-${highlightColor}-500 bg-${highlightColor}-500/10 ring-2 ring-${highlightColor}-500/30` 
        : 'border-white/5 bg-zinc-900/20'
    } flex flex-col items-start text-left hover:bg-zinc-900/40 transition-colors`}>
      {plan.is_popular && (
        <div className='absolute top-0 right-0 px-4 py-1 bg-white/10 rounded-bl-md text-sm font-medium text-zinc-400'>
          Popular
        </div>
      )}
      
      {showSavings && (
        <div className='absolute top-0 left-0 px-4 py-1 bg-green-500/20 text-green-400 rounded-br-md text-sm font-medium'>
          Save {showSavings}%
        </div>
      )}
      
      <div className={`text-sm font-medium mb-2 ${colorClasses[highlightColor as keyof typeof colorClasses]}`}>
        {plan.name}
      </div>
      
      <div className='text-4xl font-medium text-white tracking-tight mb-4'>
        ${plan.price} <span className='text-lg text-zinc-400 font-light'>/mo</span>
      </div>
      
      <p className='text-zinc-400 text-sm mb-6'>{plan.description}</p>
      
      <ul className='space-y-3 mb-8 text-sm text-zinc-300 font-light grow'>
        {plan.features.map((feature, index) => (
          <li key={index} className='flex items-center gap-3'>
            <Check className={`w-4 h-4 ${colorClasses[highlightColor as keyof typeof colorClasses].split(' ')[1]}`} />
            {feature}
          </li>
        ))}
      </ul>
      
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-xl border ${
          isSelected
            ? 'bg-white text-black hover:bg-zinc-200'
            : 'border-white/10 text-white hover:bg-white/5'
        } transition-colors text-sm font-medium cursor-pointer`}
      >
        {isSelected ? 'Selected' : 'Select Plan'}
      </button>
    </div>
  );
}
