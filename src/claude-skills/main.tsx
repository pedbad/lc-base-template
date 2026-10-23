import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../debug.css';
import ClaudeSkills from './ClaudeSkills.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClaudeSkills />
  </StrictMode>,
);
