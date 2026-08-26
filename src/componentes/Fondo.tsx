/**
 * §4.4 — Textura de ruido fino, fija, sin animar, al 4 % de opacidad.
 * La imagen vive en index.css (.textura) para no meter un data: URI
 * de varios cientos de caracteres dentro del JSX.
 */
export default function Fondo() {
  return <div className="textura" aria-hidden="true" />;
}
