import React, { useState, useRef, useEffect } from 'react';

/**
 * A discrete help tooltip component that shows contextual help on hover/click.
 * Displays a small "?" icon that reveals helpful information.
 */
const HelpTooltip = ({ children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-300 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7CB92C] focus:ring-offset-1 transition-colors"
        aria-label="Hilfe anzeigen"
      >
        ?
      </button>
      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg sm:w-80"
          role="tooltip"
        >
          <div className="absolute -top-1.5 left-2 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
          {children}
        </div>
      )}
    </span>
  );
};

/**
 * A collapsible help section that can be toggled open/closed.
 * Good for longer explanations at the top of forms.
 */
export const HelpSection = ({ title = 'Hilfe & Informationen', children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-blue-800 hover:bg-blue-100 transition-colors rounded-lg"
      >
        <span className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-800">
            ?
          </span>
          {title}
        </span>
        <svg
          className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-blue-100 px-4 py-3 text-sm text-blue-900">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Role-specific help content that only shows for certain roles.
 */
export const RoleHelp = ({ role, userRole, children }) => {
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(userRole)) return null;
  return <>{children}</>;
};

/**
 * Inline help text that appears below form fields.
 */
export const FieldHelp = ({ children, className = '' }) => (
  <p className={`mt-1 text-xs text-gray-500 ${className}`}>{children}</p>
);

export default HelpTooltip;
