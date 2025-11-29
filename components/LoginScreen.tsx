
import React, { useState } from 'react';
import type { User } from '../types';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (selectedUser) {
      onLogin(selectedUser);
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

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-xl font-semibold tracking-tight text-foreground">Simulación de Login</h2>
          <p className="text-sm text-muted-foreground mb-6">Selecciona un usuario para continuar.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="user-select" className="sr-only">Seleccionar Usuario</label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 px-3 bg-background text-foreground ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Iniciar Sesión (Local)
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Esta es una pantalla de demostración para probar los roles de usuario.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
