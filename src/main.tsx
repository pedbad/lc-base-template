/**
 * main.tsx — the browser entry for BOTH pages of a course: one LO, or the course
 * landing page.
 *
 * Which one is read from the mount point's `data-lo-folder`, not hardcoded here:
 * present names the LO to render (the prerender pass stamps it per generated page),
 * absent means the landing page (Phase D). One bundle, one entry, one `<head>` — and
 * because the prerender pass reuses the BUILT index.html as its template for every
 * page it writes, that entry has to be able to render either.
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
import CourseHome from './components/home/CourseHome.tsx';
import { buildLoIndex } from './lo/lo-index';
import { listLoSlugs, loadLo } from './lo/load-lo-glob';

const root = document.getElementById('root');
if (root === null) throw new Error('main: no #root element to mount into');

const loFolder = root.dataset.loFolder;

const app = (
  <StrictMode>
    {loFolder === undefined ? (
      <CourseHome lessons={buildLoIndex(listLoSlugs(), loadLo)} />
    ) : (
      <App lo={loadLo(loFolder)} />
    )}
  </StrictMode>
);

if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
