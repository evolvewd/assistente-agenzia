const SOURCES = [
  { href: 'https://scioperi.mit.gov.it', label: '↗ MIT Scioperi' },
  { href: 'https://www.trenitalia.com/it/informazioni/Infomobilita.html', label: '↗ Trenitalia Info' },
  { href: 'https://www.italotreno.it/it/informazioni-viaggio/italo-informa', label: '↗ Italo Informa' },
  { href: 'https://www.enac.gov.it', label: '↗ ENAC' },
];

interface AiBoxProps {
  content: string | null;
  loading: boolean;
  error: boolean;
}

export function AiBox({ content, loading, error }: AiBoxProps) {
  return (
    <div className="ai-box">
      <div className="ai-box-header">
        <div className="ai-box-title">
          <span>Analisi del giorno · FiloSofia Viaggi</span>
          <span className="ai-tag">AI</span>
        </div>
      </div>
      <div className="ai-box-body">
        <div className="ai-text">
          {loading && (
            <>
              <div className="skeleton medium" />
              <div className="skeleton" />
              <div className="skeleton short" />
            </>
          )}
          {error && (
            <p style={{ color: 'var(--red)' }}>
              Errore nel caricamento. Controlla la connessione e riprova.
            </p>
          )}
          {!loading && !error && content && (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      </div>
      <div className="sources-links">
        {SOURCES.map(({ href, label }) => (
          <a
            key={href}
            className="source-link"
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
