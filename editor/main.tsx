import React from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from './Editor';

const container = document.getElementById('editor-root');
if (container) {
  createRoot(container).render(<Editor initialActiveFileId="app.ts" />);
}
