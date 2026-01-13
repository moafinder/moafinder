import React, { useState } from 'react';
import placeholderImage from '../assets/placeholder.png';

/**
 * Image component with fallback placeholder when image fails to load or is unavailable.
 * Shows a subtle indicator that the image is a placeholder.
 */
const ImageWithFallback = ({
  src,
  alt = '',
  className = '',
  fallbackSrc = placeholderImage,
  showPlaceholderIndicator = true,
  placeholderLabel = 'Bild nicht verfügbar',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no src provided, show placeholder immediately
  const showPlaceholder = hasError || !src;

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (showPlaceholder) {
    return (
      <div className={`relative ${className}`} {...props}>
        <img
          src={fallbackSrc}
          alt={alt || placeholderLabel}
          className="w-full h-full object-cover opacity-60"
        />
        {showPlaceholderIndicator && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
              {placeholderLabel}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} {...props}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default ImageWithFallback;
