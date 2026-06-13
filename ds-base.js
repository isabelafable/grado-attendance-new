// Loads the Grado Design System (global CSS + compiled component bundle).
// Base points at the bound _ds/<folder> tree relative to this page (project root).
(() => {
  const base = '_ds/grado-design-system-045d50c2-b319-4cae-aa7c-864d7e47a7a7';
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = base + '/styles.css';
  document.head.appendChild(l);
  const s = document.createElement('script');
  s.src = base + '/_ds_bundle.js';
  s.onerror = () => console.error('ds-base.js: failed to load ' + s.src);
  document.head.appendChild(s);
})();
