import React from 'react';

const DatenschutzPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Allgemeine Hinweise</h2>
        <p className="text-gray-700">
          Der Schutz deiner persönlichen Daten ist uns sehr wichtig. Wir behandeln deine personenbezogenen Daten
          vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung. Diese
          Erklärung informiert darüber, welche Daten wir erheben, wie wir sie nutzen und welche Rechte du hast.
        </p>
        <p className="text-gray-700 mt-2">
          Verantwortlicher gemäß Art. 4 Abs. 7 DSGVO:<br />
          Reformations‑Campus e.V., Wiclefstraße 32, 10551 Berlin<br />
          E‑Mail: moafinder(at)moabit.world
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Erhebung und Nutzung personenbezogener Daten</h2>
        <h3 className="font-semibold">a) Beim Besuch der Website</h3>
        <p className="text-gray-700 mt-2">
          Beim Aufrufen unserer Website werden durch den von dir verwendeten Browser automatisch Informationen an unseren
          Server gesendet und in Server‑Logfiles gespeichert (z. B. IP‑Adresse, Datum/Uhrzeit des Zugriffs, aufgerufene
          Datei, Referrer‑URL, verwendeter Browser/OS, Access‑Provider). Die Verarbeitung erfolgt zur Sicherstellung eines
          reibungslosen Verbindungsaufbaus und der Systemsicherheit (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
        <h3 className="font-semibold mt-3">b) Kontaktformular</h3>
        <p className="text-gray-700 mt-2">
          Wenn du uns per Formular oder E‑Mail kontaktierst, werden deine Angaben zur Bearbeitung der Anfrage und für
          Anschlussfragen gespeichert (Art. 6 Abs. 1 lit. b DSGVO). Eine Weitergabe an Dritte erfolgt nicht ohne
          Einwilligung.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Weitergabe von Daten</h2>
        <p className="text-gray-700">
          Eine Übermittlung deiner personenbezogenen Daten erfolgt nur, wenn du eingewilligt hast (Art. 6 Abs. 1 lit. a
          DSGVO), die Weitergabe zur Rechtsverfolgung erforderlich ist (Art. 6 Abs. 1 lit. f DSGVO), eine gesetzliche
          Verpflichtung besteht (Art. 6 Abs. 1 lit. c DSGVO) oder dies zur Vertragsabwicklung zulässig und erforderlich ist
          (Art. 6 Abs. 1 lit. b DSGVO).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Nutzung von Drittanbieter‑Inhalten</h2>
        <p className="text-gray-700">
          Unsere Website kann Inhalte oder Dienste von Drittanbietern einbinden (z. B. Veranstaltungsdaten Dritter,
          Kartenmaterial, eingebettete Videos, Social‑Media‑Links). Hierbei kann es vorkommen, dass Anbieter deine
          IP‑Adresse verarbeiten, da diese zur Auslieferung der Inhalte erforderlich ist. Für die Datenverarbeitung durch
          Drittanbieter ist ausschließlich der jeweilige Anbieter verantwortlich. Hinweise findest du in deren
          Datenschutzerklärungen.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Cookies</h2>
        <p className="text-gray-700">
          Wir verwenden Cookies, um unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen. Rechtsgrundlage ist
          Art. 6 Abs. 1 lit. f DSGVO bzw. bei Einwilligung Art. 6 Abs. 1 lit. a DSGVO. Du kannst deinen Browser so
          einstellen, dass du über das Setzen von Cookies informiert wirst und Cookies nur im Einzelfall erlaubst.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Analyse‑Tools (optional)</h2>
        <p className="text-gray-700">
          Sofern wir Webanalyse‑Dienste (z. B. Matomo oder Google Analytics) nutzen, geschieht dies nur auf Grundlage deiner
          Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst deine Einwilligung jederzeit über die Cookie‑Einstellungen
          widerrufen.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Betroffenenrechte</h2>
        <p className="text-gray-700">
          Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO),
          Einschränkung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) sowie Beschwerde bei einer Aufsichtsbehörde
          (Art. 77 DSGVO).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
        <p className="text-gray-700">
          Reformations‑Campus e.V., Wiclefstraße 32, 10551 Berlin – E‑Mail:{' '}
          <a className="text-[#7CB92C] hover:underline" href="mailto:moafinder@moabit.world">moafinder@moabit.world</a>
        </p>
      </section>
    </div>
  );
};

export default DatenschutzPage;

