import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import Sandbox from './Sandbox.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sandbox />
  </StrictMode>,
);
