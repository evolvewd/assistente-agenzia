/**
 * Mostrato quando il backend non ha ANTHROPIC_API_KEY configurata (503).
 */
export function ApiConfigBanner() {
  return (
    <div
      role="alert"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--red)',
        borderRadius: 8,
        padding: 16,
        margin: 24,
        marginBottom: 0,
        color: 'var(--text)',
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <strong>Chiave API non configurata</strong>
      <p style={{ marginTop: 8, marginBottom: 0, color: 'var(--text2)' }}>
        Su Vercel: Project Settings → Environment Variables → aggiungi <code>ANTHROPIC_API_KEY</code> (o Secrets).
        <br />
        In locale: crea un file <code>.env.local</code> con <code>ANTHROPIC_API_KEY=sk-ant-...</code> (vedi <code>.env.example</code>).
      </p>
    </div>
  );
}
