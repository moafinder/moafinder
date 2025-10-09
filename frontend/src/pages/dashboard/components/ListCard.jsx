import React from 'react';

const ListCard = ({ color, tag, title, subtitle, meta, children, actions = [] }) => (
  <article className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-stretch">
    <div className="flex items-stretch md:w-20">
      <div
        className="h-16 w-16 flex-shrink-0 rounded-md md:h-auto md:w-20"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
    </div>
    <div className="flex flex-1 flex-col gap-2">
      {tag && <p className="text-xs font-semibold uppercase tracking-wide text-[#7CB92C]">{tag}</p>}
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      {children}
      {meta && <p className="text-xs text-gray-500">{meta}</p>}
    </div>
    {actions && actions.length > 0 && (
      <div className="flex w-full flex-col justify-center gap-2 md:w-auto md:flex-shrink-0 md:items-end">
        {actions.map((action, index) => (
          <div key={index} className="w-full md:w-auto">
            {action}
          </div>
        ))}
      </div>
    )}
  </article>
);

export default ListCard;
