import React from 'react';

const ImpressumPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Impressum</h1>

      <section className="space-y-1 mb-8">
        <p><strong>Reformations-Campus e.V.</strong> (Website-Betreiber)</p>
        <p>Eingetragener Verein (Rechtsform)</p>
        <p>Wiclefstraße 32<br />10551 Berlin<br />Deutschland</p>
        <p>E‑Mail: <a className="text-[#7CB92C] hover:underline" href="mailto:moafinder@moabit.world">moafinder@moabit.world</a></p>
        <p>Vertretungsberechtigte Person: Stephan Rauhut</p>
        <p>Steuernummer: 27/656/57006</p>
        <p>Land, in dem die Seite betrieben wird: Deutschland</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Haftungsausschluss</h2>
        <h3 className="font-semibold">Haftung für Inhalte</h3>
        <p className="text-gray-700 mt-2">
          Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und
          Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs. 1
          TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind
          wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur
          Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
          Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung
          möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
        </p>

        <h3 className="font-semibold mt-4">Haftung für Links</h3>
        <p className="text-gray-700 mt-2">
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb
          können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets
          der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
          Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht
          erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer
          Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend
          entfernen.
        </p>

        <h3 className="font-semibold mt-4">Urheberrecht</h3>
        <p className="text-gray-700 mt-2">
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
          Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des
          Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien
          dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite
          nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Solltest du trotzdem auf eine
          Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von
          Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Hinweis zur Verantwortlichkeit für gelistete Veranstaltungen</h2>
        <p className="text-gray-700 mt-2">
          Die auf dieser Website aufgeführten Veranstaltungen werden von Dritten organisiert und durchgeführt. MoaFinder
          und der Reformations‑Campus e.V. übernehmen keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der
          Angaben zu Terminen, Veranstaltungsorten, Preisen oder sonstigen Inhalten. Vertragliche Beziehungen kommen
          ausschließlich zwischen dem Besucher und dem jeweiligen Veranstalter zustande.
        </p>
      </section>
    </div>
  );
};

export default ImpressumPage;

