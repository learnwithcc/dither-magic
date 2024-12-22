import React, { useState, useEffect, useCallback } from 'react';
import { cn } from "@/lib/utils";

const ImageCompareSlider = ({ 
  originalImage, 
  processedImage, 
  className 
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = useCallback((event) => {
    if (!isDragging) return;

    const slider = event.currentTarget;
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleMouseDown = () => setIsDragging(true);
  
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMove);
    }
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div 
      className={cn(
        "relative select-none overflow-hidden rounded-lg", 
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMove}
    >
      {/* Original Image */}
      <img
        src={originalImage}
        alt="Original"
        className="w-full h-full object-cover"
      />
      
      {/* Processed Image Overlay */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 w-full"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
        }}
      >
        <img
          src={processedImage}
          alt="Processed"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-gray-600"
          >
            <path d="M21 12H3M9 6l-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export { ImageCompareSlider };
