import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

/**
 * Interactive before/after image comparison slider.
 *
 * Displays two overlapping images with a draggable divider that reveals
 * the original image on the left and processed image on the right.
 *
 * @component
 * @param {Object} props
 * @param {string} props.originalSrc - URL of the original (before) image
 * @param {string} props.processedSrc - URL of the processed (after) image
 * @param {string} props.originalAlt - Alt text for original image
 * @param {string} props.processedAlt - Alt text for processed image
 * @param {number} props.initialPosition - Initial slider position (0-100)
 * @param {Object} props.style - Additional container styles
 */
const ComparisonSlider = ({
  originalSrc,
  processedSrc,
  originalAlt = 'Original',
  processedAlt = 'Processed',
  initialPosition = 50,
  style = {}
}) => {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  /**
   * Calculate slider position from mouse/touch event
   */
  const calculatePosition = useCallback((clientX) => {
    if (!containerRef.current) return sliderPosition;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Clamp between 0 and 100
    return Math.min(100, Math.max(0, percentage));
  }, [sliderPosition]);

  /**
   * Handle mouse down on slider
   */
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * Handle mouse move while dragging
   */
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setSliderPosition(calculatePosition(e.clientX));
  }, [isDragging, calculatePosition]);

  /**
   * Handle mouse up to stop dragging
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle touch events for mobile
   */
  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setSliderPosition(calculatePosition(touch.clientX));
  }, [isDragging, calculatePosition]);

  /**
   * Handle click on container to jump slider position
   */
  const handleContainerClick = useCallback((e) => {
    // Don't jump if clicking on the handle
    if (e.target.closest('.slider-handle')) return;
    setSliderPosition(calculatePosition(e.clientX));
  }, [calculatePosition]);

  /**
   * Handle keyboard navigation for accessibility
   */
  const handleSliderKeyboard = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.stopPropagation();
        setSliderPosition(pos => Math.max(0, pos - 5));
        break;
      case 'ArrowRight':
        e.stopPropagation();
        setSliderPosition(pos => Math.min(100, pos + 5));
        break;
      case 'Home':
        e.stopPropagation();
        setSliderPosition(0);
        break;
      case 'End':
        e.stopPropagation();
        setSliderPosition(100);
        break;
    }
  }, []);

  // Add/remove global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);

      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-col-resize select-none"
      style={style}
      onClick={handleContainerClick}
    >
      {/* Processed (After) Image - Full width background */}
      <img
        src={processedSrc}
        alt={processedAlt}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Original (Before) Image - Clipped by slider position */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={originalSrc}
          alt={originalAlt}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="slider-handle absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        role="slider"
        aria-label="Image comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPosition)}
        aria-valuetext={`${Math.round(sliderPosition)}% original, ${Math.round(100 - sliderPosition)}% processed`}
        tabIndex={0}
        onKeyDown={handleSliderKeyboard}
      >
        {/* Handle grip */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Vertical line */}
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white -translate-x-1/2" />
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        Original
      </div>
      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        Dithered
      </div>

      {/* Position indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        {Math.round(sliderPosition)}% / {Math.round(100 - sliderPosition)}%
      </div>
    </div>
  );
};

export default ComparisonSlider;
