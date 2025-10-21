import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha e-mail e senha.');
      return;
    }
    setIsLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.status !== 'SUCCESS') {
        setIsLoading(false);
        if (result.status === 'INACTIVE_ACCOUNT') {
            setError('Sua conta está inativa. Entre em contato com o suporte.');
        } else {
            setError('E-mail ou senha inválidos.');
        }
    }
    // On success, the component will re-render with the new `user` state,
    // and the redirect logic below will handle navigation.
  };
  
  if (user) {
    switch (user.role) {
      case UserRole.ADMIN:
        return <Navigate to="/admin" replace />;
      case UserRole.COMPANY:
        return <Navigate to="/company/dashboard" replace />;
      case UserRole.USER:
        return <Navigate to="/user/home" replace />;
      default:
        return null; // Should not happen with a valid user
    }
  }
  
  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
            <LoadingSpinner text="Entrando" />
        </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 text-center">
        <div className="mb-8">
          <img 
            src="https://aisfizoyfpcisykarrnt.supabase.co/storage/v1/object/public/imagens/LOGO%20TRIAD3%20.png" 
            alt="Triad3 Logo" 
            className="h-24 w-24 rounded-full transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/50"
          />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-10">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gradient-cyan-light to-gradient-blue-light">Pesquisa Inteligente</span> Triad3
        </h1>

        <div className="w-full max-w-sm bg-light-background dark:bg-dark-card p-8 rounded-xl shadow-2xl border border-light-border dark:border-dark-border flex items-center justify-center" style={{minHeight: '430px'}}>
            <div className="w-full">
              <h2 className="text-2xl font-bold mb-6 text-center text-light-text dark:text-dark-text">Acessar Plataforma</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value.toLowerCase());
                      setError('');
                    }}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary placeholder-gray-500"
                    placeholder="Seu e-mail"
                    required
                    aria-label="Email"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary placeholder-gray-500"
                    placeholder="Sua senha"
                    required
                    aria-label="Senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-light-primary dark:hover:text-white"
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-sm font-medium text-center text-error -my-2">{error}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 mt-2 px-4 rounded-lg text-lg font-bold text-white bg-gradient-to-r from-gradient-cyan to-gradient-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-background dark:focus:ring-offset-dark-card focus:ring-gradient-blue transition-opacity"
                >
                  Entrar
                </button>
              </form>
            </div>
        </div>
      </main>
      <footer className="w-full text-center p-4 mt-8 text-sm text-gray-500">
        Powered by: Triad3 Inteligência Digital
      </footer>
    </div>
  );
};

export default LoginPage;
