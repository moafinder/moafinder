import React from 'react';

const EditorGuidelinesPage = () => (
  <div className="space-y-6">
    <header>
      <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Redaktion</p>
      <h1 className="text-3xl font-bold text-gray-900">Regelkatalog</h1>
      <p className="text-sm text-gray-600">Interne Leitlinien für die Prüfung und Veröffentlichung von Inhalten.</p>
    </header>

    <section className="rounded-xl bg-white p-6 shadow-sm space-y-4 text-sm text-gray-700">
      <p>
        Diese Seite sammelt die redaktionellen Grundsätze. Aktualisiere sie im Payload-Backend oder passe den Text hier an,
        sobald der finale Inhalt vorliegt. Vorschläge:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Alle Veranstaltungen müssen eindeutig Moabit-Bezug haben.</li>
        <li>Formulierungen in der dritten Person, keine direkte Werbung.</li>
        <li>Barrierefreiheit immer markieren, falls vorhanden.</li>
        <li>Bilder nur mit ausreichendem Alt-Text veröffentlichen.</li>
        <li>Bei Unklarheiten Kontakt mit der Veranstalter*in aufnehmen.</li>
      </ul>
      <p>
        Ergänze hier Checklisten, Qualitätsstandards oder Links zu Dokumenten, die das Redaktionsteam benötigt. Wenn der
        Regelkatalog später im CMS gepflegt wird, kann dieser Platzhalter durch eine CMS-Abfrage ersetzt werden.
      </p>
    </section>
  </div>
);

export default EditorGuidelinesPage;
