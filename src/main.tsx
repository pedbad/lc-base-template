/**
 * main.tsx — the browser entry for an LO page.
 *
 * Which LO renders is read from the mount point's `data-lo-folder`, not hardcoded
 * here: Part D's prerender pass stamps that attribute per page, so one bundle serves
 * every LO and the client always hydrates the LO the page was rendered from.
 *
 * hydrate vs create: a prerendered page arrives with markup already in #root (that
 * markup IS the no-JS page), so it must be adopted, not discarded and re-rendered.
 * The dev server serves an empty #root, which is the createRoot case. The showcase
 * entry (src/showcase/main.tsx) is never prerendered and keeps createRoot outright.
 */
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { loadLo } from './lo/load-lo-glob';

const root = document.getElementById('root');
if (root === null) throw new Error('main: no #root element to mount into');

const loFolder = root.dataset.loFolder;
if (loFolder === undefined) {
  throw new Error('main: #root has no data-lo-folder — the page does not say which LO to render');
}

const app = (
  <StrictMode>
    <App lo={loadLo(loFolder)} />
  </StrictMode>
);

if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
