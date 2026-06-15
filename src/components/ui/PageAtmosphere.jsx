/* Fixed, full-viewport ambient backdrop for inner pages.
   The home page gets its depth from a live WebGL scene + #scene-atmosphere glow.
   Inner pages don't run that scene, so this lightweight CSS layer recreates the
   same electric-blue atmosphere — a top halo behind the hero, three slowly
   drifting aurora blobs, a faint masked grid, and an edge vignette — entirely on
   the GPU (transform/opacity only). Purely decorative, so it's aria-hidden and
   never intercepts pointer events. */
export default function PageAtmosphere() {
  return (
    <div className="page-atmos" aria-hidden="true">
      <div className="page-atmos-halo" />
      <div className="page-atmos-aurora page-atmos-aurora--1" />
      <div className="page-atmos-aurora page-atmos-aurora--2" />
      <div className="page-atmos-aurora page-atmos-aurora--3" />
      <div className="page-atmos-grid" />
      <div className="page-atmos-vignette" />
    </div>
  )
}
