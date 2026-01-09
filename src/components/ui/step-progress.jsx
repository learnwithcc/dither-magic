import React from 'react';
import { Check, Upload, Settings, Loader2, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Step progress indicator component for ADHD-friendly workflow visualization.
 * Shows clear progress through a multi-step process with visual feedback.
 *
 * @param {Object} props
 * @param {number} props.currentStep - Current active step (1-4)
 * @param {boolean} props.hasFiles - Whether files have been uploaded
 * @param {boolean} props.hasAlgorithms - Whether algorithms are selected
 * @param {boolean} props.isProcessing - Whether processing is in progress
 * @param {boolean} props.hasResults - Whether results are available
 */
const StepProgress = ({
  currentStep = 1,
  hasFiles = false,
  hasAlgorithms = false,
  isProcessing = false,
  hasResults = false
}) => {
  const steps = [
    {
      id: 1,
      label: 'Upload',
      icon: Upload,
      completed: hasFiles,
      description: 'Add images'
    },
    {
      id: 2,
      label: 'Configure',
      icon: Settings,
      completed: hasFiles && hasAlgorithms,
      description: 'Pick style'
    },
    {
      id: 3,
      label: 'Process',
      icon: isProcessing ? Loader2 : Check,
      completed: hasResults,
      description: 'Apply effects'
    },
    {
      id: 4,
      label: 'Review',
      icon: Image,
      completed: false,
      description: 'Download'
    },
  ];

  return (
    <div className="w-full mb-6">
      {/* Progress bar background */}
      <div className="relative">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isPast = currentStep > step.id || step.completed;
            const isProcessingStep = step.id === 3 && isProcessing;

            return (
              <React.Fragment key={step.id}>
                {/* Step circle */}
                <div className="flex flex-col items-center z-10">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      "border-2 font-semibold",
                      isPast && !isActive && "bg-green-500 border-green-500 text-white",
                      isActive && "bg-blue-500 border-blue-500 text-white scale-110 shadow-lg",
                      !isPast && !isActive && "bg-gray-100 border-gray-300 text-gray-400"
                    )}
                  >
                    {isPast && !isActive ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className={cn(
                        "w-5 h-5",
                        isProcessingStep && "animate-spin"
                      )} />
                    )}
                  </div>

                  {/* Step label */}
                  <span className={cn(
                    "mt-2 text-sm font-medium transition-colors",
                    isActive && "text-blue-600",
                    isPast && !isActive && "text-green-600",
                    !isPast && !isActive && "text-gray-400"
                  )}>
                    {step.label}
                  </span>

                  {/* Step description - only on larger screens */}
                  <span className="hidden sm:block text-xs text-gray-400 mt-0.5">
                    {step.description}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2 h-1 relative -mt-8 sm:-mt-12">
                    <div className="absolute inset-0 bg-gray-200 rounded-full" />
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all duration-500",
                        isPast ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Current step hint */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 bg-gray-50 inline-block px-4 py-2 rounded-full">
          {currentStep === 1 && !hasFiles && "Start by uploading some images"}
          {currentStep === 1 && hasFiles && "Great! Now pick a style"}
          {currentStep === 2 && "Choose an algorithm preset or customize"}
          {currentStep === 3 && isProcessing && "Processing your images..."}
          {currentStep === 3 && !isProcessing && hasAlgorithms && "Ready to process!"}
          {currentStep === 4 && "Compare and download your results"}
        </p>
      </div>
    </div>
  );
};

export default StepProgress;
