import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let errorDetails = "";

      if (this.state.error) {
        try {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error) {
            errorMessage = "A database error occurred.";
            errorDetails = parsedError.error;
          }
        } catch (e) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-cream p-4">
          <div className="bg-white border-4 border-black rounded-card shadow-cartoon p-8 max-w-md w-full text-center">
            <h1 className="font-title text-3xl text-red-500 mb-4 uppercase">Oops!</h1>
            <p className="text-lg font-medium mb-4">{errorMessage}</p>
            {errorDetails && (
              <div className="bg-gray-100 p-4 rounded text-left text-sm font-mono overflow-auto mb-6">
                {errorDetails}
              </div>
            )}
            <button
              className="bg-lime border-2 border-black rounded-button px-6 py-2 font-title text-xl uppercase shadow-cartoon hover:translate-y-1 hover:shadow-none transition-all"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
