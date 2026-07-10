import React from 'react';
import { renderToString } from 'react-dom/server';
import AdminDashboard from './src/pages/AdminDashboard';

try {
  renderToString(<AdminDashboard />);
  console.log("Rendered successfully");
} catch (e) {
  console.error("Crash during render:", e);
}
