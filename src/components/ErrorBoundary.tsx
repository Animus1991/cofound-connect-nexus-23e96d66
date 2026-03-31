import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="mt-2 text-muted-foreground">
              An unexpected error occurred. Please try again or return to the home page.
            </p>
            {this.state.error && (
              <p className="mt-2 text-xs text-muted-foreground/70 font-mono truncate max-w-full" title={this.state.error.message}>
                {this.state.error.message}
              </p>
            )}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="hero"
                className="gap-2"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </Button>
              <Link to="/">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Home className="h-4 w-4" /> Go home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
