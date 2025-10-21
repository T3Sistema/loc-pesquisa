import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { UsersIcon } from './icons/UsersIcon';

interface StepperProps {
  currentStep: number;
  setStep: (step: number) => void;
}

const steps = [
  { number: 1, title: 'Detalhes', icon: PencilSquareIcon },
  { number: 2, title: 'Perguntas', icon: CheckCircleIcon },
  { number: 3, title: 'Participantes e Equipe', icon: UsersIcon },
];

export const CampaignEditorStepper: React.FC<StepperProps> = ({ currentStep, setStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center">
        {steps.map((step, stepIdx) => (
          <li key={step.title} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {step.number < currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-light-primary" />
                </div>
                <button
                  onClick={() => setStep(step.number)}
                  className="relative w-8 h-8 flex items-center justify-center bg-light-primary rounded-full hover:bg-light-primary/90"
                >
                  <step.icon className="w-5 h-5 text-white" aria-hidden="true" />
                  <span className="sr-only">{step.title}</span>
                </button>
              </>
            ) : step.number === currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <button
                  onClick={() => setStep(step.number)}
                  className="relative w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border-2 border-light-primary rounded-full"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 bg-light-primary rounded-full" aria-hidden="true" />
                  <span className="sr-only">{step.title}</span>
                </button>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <button
                  onClick={() => setStep(step.number)}
                  className="group relative w-8 h-8 flex items-center justify-center bg-white dark:bg-dark-background border-2 border-gray-300 dark:border-gray-600 rounded-full hover:border-gray-400"
                >
                  <span
                    className="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.title}</span>
                </button>
              </>
            )}
            <p className="absolute -bottom-6 w-32 text-center text-xs font-medium text-light-text dark:text-dark-text left-4 -translate-x-1/2">{step.title}</p>
          </li>
        ))}
      </ol>
    </nav>
  );
};