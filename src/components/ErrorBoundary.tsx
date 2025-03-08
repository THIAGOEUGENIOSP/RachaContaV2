import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado</h1>
            <p className="text-gray-600 mb-4">
              Desculpe, ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>
            {this.state.error && (
              <pre className="bg-gray-100 p-3 rounded text-sm text-left mb-4 overflow-auto">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="btn-primary flex items-center justify-center mx-auto"
            >
              <RefreshCw size={16} className="mr-2" />
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}