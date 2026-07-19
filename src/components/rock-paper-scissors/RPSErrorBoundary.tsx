import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class RPSErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[RPSErrorBoundary] Caught rendering error in RPS module:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans select-none items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/80 border border-rose-500/30 rounded-3xl p-6 text-center space-y-6 shadow-2xl backdrop-blur-md">
            
            {/* Warning Icon Banner */}
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white">Arena Display Error</h3>
              <p className="text-xs text-slate-400">
                An unexpected interface rendering exception occurred inside the Battle Arena.
              </p>
            </div>

            {/* Error Message log panel */}
            <div className="text-left bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 font-mono text-[10px] text-rose-400 max-h-36 overflow-y-auto break-all leading-relaxed">
              {this.state.error.message || String(this.state.error)}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/15"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-enter Arena
              </button>
              <button
                onClick={() => window.location.reload()}
                className="py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-3.5 h-3.5" /> Reload App
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
