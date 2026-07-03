import { renderToString } from 'react-dom/server';
import React from 'react';
import LibraryDetail from './src/pages/Library/LibraryDetail.jsx';
import { BrowserRouter } from 'react-router-dom';

try {
  console.log("Compiling LibraryDetail...");
} catch(e) {
  console.error(e);
}
