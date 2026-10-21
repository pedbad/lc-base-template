import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../debug.css';
import CodeStyle from './CodeStyle.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CodeStyle />
  </StrictMode>,
);
