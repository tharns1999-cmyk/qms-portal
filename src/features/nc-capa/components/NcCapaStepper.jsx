import React from 'react';
import { Check } from 'lucide-react';

const NcCapaStepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative">
        {/* Progress bar background (only visible on desktop) */}
        <div className="hidden md:block absolute top-4 left-0 w-full h-0.5 bg-zinc-200 -z-10 px-8" />
        
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          const isPending = currentStep < index;

          return (
            <div 
              key={index} 
              className={`flex md:flex-col items-center mb-4 md:mb-0 relative w-full md:w-auto ${onStepClick && (isCompleted || isCurrent) ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (onStepClick && (isCompleted || isCurrent)) onStepClick(index);
              }}
            >
              <div className="relative z-10 flex items-center justify-center">
                <div 
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2
                    ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : ''}
                    ${isCurrent ? 'bg-white border-blue-600 text-blue-600' : ''}
                    ${isPending ? 'bg-white border-zinc-300 text-zinc-400' : ''}
                  `}
                >
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : (index + 1)}
                </div>
              </div>
              
              <div className="ml-4 md:ml-0 md:mt-2 text-left md:text-center">
                <span className={`text-xs font-semibold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-zinc-800' : 'text-zinc-400'}`}>
                  {step.label}
                </span>
                {step.subLabel && (
                  <p className="hidden md:block text-[10px] text-zinc-400">{step.subLabel}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NcCapaStepper;
