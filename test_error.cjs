const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /export default function AdminDashboard\(\) \{/,
  `
import React from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("AdminDashboard Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-white p-10 bg-red-900 min-h-screen"><h1>CRASHED: {String(this.state.error)}</h1><pre>{this.state.error && this.state.error.stack}</pre></div>;
    }
    return this.props.children; 
  }
}

export default function AdminDashboard() {
  return <ErrorBoundary><AdminDashboardContent /></ErrorBoundary>;
}

function AdminDashboardContent() {`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log("Wrapped in ErrorBoundary");
