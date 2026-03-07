import { Check } from 'lucide-react';
import type { Step } from '../types';

interface Props {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: Props) {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between relative">
        <div
          className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0"
          style={{ left: '16px', right: '16px' }}
        />
        <div
          className="absolute top-4 left-0 h-0.5 bg-blue-600 z-0 transition-all duration-500"
          style={{
            left: '16px',
            width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 32px)`,
          }}
        />

        {steps.map((step, idx) => {
          const done = idx < currentStep;
          const active = idx === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ring-2 ring-white ${
                  done
                    ? 'bg-blue-600 text-white'
                    : active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : <span>{idx + 1}</span>}
              </div>
              <p className={`mt-2 text-xs font-medium hidden sm:block text-center leading-tight ${
                active ? 'text-blue-700' : done ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-400 hidden lg:block text-center">{step.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
