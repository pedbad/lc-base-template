import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../debug.css';
import CulpSyllabi from './CulpSyllabi.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CulpSyllabi />
  </StrictMode>,
);
