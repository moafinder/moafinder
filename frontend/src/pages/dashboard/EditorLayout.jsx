import React from 'react';

const sections = [
  { index: 'Veranstaltungen zur Prüfung', status: 'pending' },
  { index: 'Freigegebene Veranstaltungen', status: 'approved' },
  { index: 'Archivierte Veranstaltungen', status: 'archived' },
  { index: 'Entwürfe von Veranstaltern', status: 'draft' },
];

const EditorLayout = ({ counts, onFilterChange, activeFilter, children }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-4">
      {sections.map((section) => (
        <button
          key={section.status}
          type="button"
          onClick={() => onFilterChange(section.status)}
          className={`flex flex-col rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow ${
            activeFilter === section.status ? 'border-[#7CB92C] bg-[#F0F8E8]' : 'border-gray-200 bg-white'
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{section.index}</span>
          <span className="text-2xl font-semibold text-gray-900">{counts[section.status] ?? 0}</span>
        </button>
      ))}
    </div>
    {children}
  </div>
);

export default EditorLayout;
