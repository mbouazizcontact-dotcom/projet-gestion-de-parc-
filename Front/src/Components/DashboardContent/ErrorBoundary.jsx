import React from "react";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8 text-red-600 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-bold mb-4">Une erreur est survenue</h2>
          <p className="text-sm md:text-base mb-4">
            {this.state.error?.message || "Une erreur inattendue s'est produite."}
          </p>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Veuillez réessayer ou contacter le support si le problème persiste.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;