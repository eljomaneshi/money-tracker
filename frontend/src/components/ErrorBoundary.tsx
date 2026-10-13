import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900/40 dark:bg-[#0d1526] sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            {this.props.fallbackTitle || "Something went wrong loading this section"}
          </h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400">
            An unexpected error occurred while rendering this component. You can reload the page or continue using other sections.
          </p>
          {this.state.error && (
            <pre className="mt-3 max-w-full overflow-x-auto rounded-xl bg-slate-100 p-2.5 font-mono text-[11px] text-slate-700 dark:bg-white/5 dark:text-slate-300">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
