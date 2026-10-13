import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../debug.css';
import UiShowcase from './UiShowcase.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiShowcase />
  </StrictMode>,
);
