


import React, { useState } from 'react';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from '../services/firebaseConfig';
import type { User } from '../types';

interface LoginScreenProps {
  users: User[]; // Kept for interface compatibility but unused in real auth
  onLogin: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // The logic to fetch the Firestore user profile happens in App.tsx via onAuthStateChanged
      // or we can pass the auth user up.
      // Here we just trigger the flow.
    } catch (err: any) {
      console.error("Login Error:", err);
      let errorMessage = "No se pudo iniciar sesión.";
      if (err.code === 'auth/popup-closed-by-user') {
          errorMessage = "Inicio de sesión cancelado.";
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mx-auto flex flex-col items-center gap-1 mb-8 text-center">
            <div>
                <span className="text-2xl font-bold text-green-600 tracking-tight">Gestión de Exportaciones</span>
                <span className="ml-2 text-sm font-bold text-gray-400 italic">by KAVO</span>
            </div>
        </div>

        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground text-center">Bienvenido</h2>
          <p className="text-sm text-muted-foreground mb-8 text-center">Inicia sesión con tu cuenta corporativa.</p>
          
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-md bg-white border border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300 transition-all"
            >
              {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : (
                  <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
              )}
              Continuar con Google
            </button>
          </div>

          {error && (
              <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive text-center">{error}</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
