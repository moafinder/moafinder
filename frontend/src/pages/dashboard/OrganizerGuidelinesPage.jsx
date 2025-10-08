import React from 'react';

const OrganizerGuidelinesPage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#7CB92C]">Regelkatalog</p>
      <h1 className="text-3xl font-bold text-gray-900">Qualitätsrichtlinien für Veranstaltungen</h1>
      <p className="text-sm text-gray-600">
        Bitte beachte diese Hinweise, bevor du neue Angebote einreichst. Sie helfen der Redaktion, deine Inhalte schneller
        zu prüfen und freizugeben.
      </p>
    </header>

    <section className="rounded-xl bg-white p-6 shadow-sm text-sm text-gray-700">
      <ul className="list-disc space-y-3 pl-6">
        <li>Der Veranstaltungstext sollte klar, barrierearm und ohne Werbesprache formuliert sein.</li>
        <li>
          Prüfe, ob Ort, Datum und Uhrzeit korrekt sind. Wiederkehrende Angebote benötigen einen Hinweis auf den Rhythmus.
        </li>
        <li>Beschreibe, für wen das Angebot ist und ob eine Anmeldung oder Kosten anfallen.</li>
        <li>
          Lade aussagekräftige Bilder mit ausreichendem Alt-Text hoch. Stelle sicher, dass du die Nutzungsrechte besitzt.
        </li>
        <li>Hinterlege eine Kontaktmöglichkeit für Rückfragen und aktualisiere sie regelmäßig.</li>
      </ul>
      <p className="mt-4">
        Bei Unsicherheiten erreichst du die Redaktion unter{' '}
        <a href="mailto:moafinder@moabit.world" className="text-[#417225] hover:underline">
          moafinder@moabit.world
        </a>
        . Wir freuen uns auf deine Beiträge!
      </p>
    </section>
  </div>
);

export default OrganizerGuidelinesPage;
