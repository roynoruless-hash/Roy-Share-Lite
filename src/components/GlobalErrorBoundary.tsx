import React from 'react';
import { AlertCircle } from 'lucide-react';

export class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, info: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("GlobalErrorBoundary caught an error:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center z-50 relative">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">App Crashed</h2>
          <div className="bg-slate-900 border border-red-500/30 p-4 rounded-xl text-left max-w-full overflow-auto w-full max-w-2xl">
            <p className="text-red-400 font-mono text-sm mb-4 font-bold">{this.state.error?.toString()}</p>
            <pre className="text-slate-400 font-mono text-xs whitespace-pre-wrap">
              {this.state.info?.componentStack}
            </pre>
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
