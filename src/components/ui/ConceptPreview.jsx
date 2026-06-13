/* ── Concept preview mockups ─────────────────────────────────────────────────
   Component-based placeholder previews for work items that have no real
   screenshots yet. Each kind renders a small dark UI mockup (browser chrome +
   stylised interface blocks) so previews look intentional, not empty.
   Swap a work item to mediaType: 'image' + mediaSrc once real captures exist. */

function Chrome() {
  return (
    <div className="cpv-chrome" aria-hidden="true">
      <i /><i /><i />
      <span className="cpv-url" />
    </div>
  )
}

const KINDS = {
  /* Marketing website: nav, hero lines, CTA buttons, card row */
  website: (
    <>
      <div className="cpv-nav">
        <span className="cpv-dot cpv-dot--accent" />
        <span className="cpv-line" style={{ width: '18%' }} />
        <span className="cpv-line" style={{ width: '12%', marginLeft: 'auto' }} />
        <span className="cpv-pill-btn" />
      </div>
      <div className="cpv-hero">
        <span className="cpv-line cpv-line--xl" style={{ width: '62%' }} />
        <span className="cpv-line cpv-line--xl" style={{ width: '44%' }} />
        <span className="cpv-line" style={{ width: '52%', opacity: 0.5 }} />
        <div className="cpv-btn-row">
          <span className="cpv-pill-btn cpv-pill-btn--primary" />
          <span className="cpv-pill-btn" />
        </div>
      </div>
      <div className="cpv-card-row">
        <span className="cpv-mini-card" /><span className="cpv-mini-card" /><span className="cpv-mini-card" />
      </div>
    </>
  ),

  /* Client portal: sidebar + document rows with status pills */
  portal: (
    <div className="cpv-split">
      <div className="cpv-sidebar">
        <span className="cpv-dot cpv-dot--accent" />
        <span className="cpv-line" /><span className="cpv-line" style={{ width: '70%' }} />
        <span className="cpv-line" style={{ width: '80%' }} /><span className="cpv-line" style={{ width: '60%' }} />
      </div>
      <div className="cpv-main">
        <span className="cpv-line cpv-line--lg" style={{ width: '45%' }} />
        {[78, 64, 70, 56].map((w, i) => (
          <div className="cpv-file-row" key={i}>
            <span className="cpv-file-icon" />
            <span className="cpv-line" style={{ width: `${w - 30}%` }} />
            <span className={`cpv-status ${i % 2 ? '' : 'cpv-status--ok'}`} />
          </div>
        ))}
      </div>
    </div>
  ),

  /* Inspection system: checklist + photo grid + progress */
  inspection: (
    <div className="cpv-split">
      <div className="cpv-main">
        <span className="cpv-line cpv-line--lg" style={{ width: '52%' }} />
        {[0, 1, 2].map((i) => (
          <div className="cpv-check-row" key={i}>
            <span className={`cpv-checkbox${i < 2 ? ' cpv-checkbox--done' : ''}`} />
            <span className="cpv-line" style={{ width: `${68 - i * 12}%` }} />
          </div>
        ))}
        <div className="cpv-progress"><span style={{ width: '64%' }} /></div>
      </div>
      <div className="cpv-photo-grid">
        <span /><span /><span /><span />
      </div>
    </div>
  ),

  /* Digital menu: category tabs + items with price marks */
  menu: (
    <>
      <div className="cpv-tabs">
        <span className="cpv-tab cpv-tab--active" /><span className="cpv-tab" /><span className="cpv-tab" />
      </div>
      {[72, 60, 66, 54].map((w, i) => (
        <div className="cpv-menu-row" key={i}>
          <span className="cpv-thumb" />
          <div className="cpv-menu-lines">
            <span className="cpv-line" style={{ width: `${w}%` }} />
            <span className="cpv-line" style={{ width: `${w - 26}%`, opacity: 0.45 }} />
          </div>
          <span className="cpv-price" />
        </div>
      ))}
    </>
  ),

  /* AI chat agent: conversation bubbles + input bar */
  chat: (
    <>
      <div className="cpv-chat">
        <span className="cpv-bubble cpv-bubble--in" style={{ width: '58%' }} />
        <span className="cpv-bubble cpv-bubble--out" style={{ width: '64%' }} />
        <span className="cpv-bubble cpv-bubble--in" style={{ width: '42%' }} />
        <span className="cpv-bubble cpv-bubble--out" style={{ width: '70%' }} />
      </div>
      <div className="cpv-input">
        <span className="cpv-line" style={{ width: '40%', opacity: 0.4 }} />
        <span className="cpv-send" />
      </div>
    </>
  ),

  /* Smart dashboard: KPI cards + bar chart */
  dashboard: (
    <>
      <div className="cpv-kpis">
        <span className="cpv-kpi" /><span className="cpv-kpi" /><span className="cpv-kpi" />
      </div>
      <div className="cpv-chart">
        {[42, 68, 55, 80, 62, 90, 74, 96].map((h, i) => (
          <span key={i} style={{ height: `${h}%` }} className={i === 7 ? 'cpv-bar cpv-bar--hot' : 'cpv-bar'} />
        ))}
      </div>
      <span className="cpv-line" style={{ width: '38%', opacity: 0.45 }} />
    </>
  ),
}

export default function ConceptPreview({ kind = 'website', label }) {
  return (
    <div className={`cpv cpv--${kind}`} role="img" aria-label={label}>
      <Chrome />
      <div className="cpv-body">{KINDS[kind] ?? KINDS.website}</div>
    </div>
  )
}
