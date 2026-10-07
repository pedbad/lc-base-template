import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../debug.css';
import Showcase from './Showcase.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Showcase />
  </StrictMode>,
);
