import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { Bars3Icon } from './icons/Bars3Icon';

const Header: React.FC<{ title: string; onToggleSidebar?: () => void }> = ({ title, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/');
  };
  
  const getProfileLink = () => {
      if (!user) return '/';
      switch(user.role) {
          case 'admin': return '/admin/profile';
          case 'user': return '/user/profile';
          case 'company': return '/company/profile';
          default: return '/';
      }
  }

  return (
    <header className="bg-light-background dark:bg-dark-card text-light-text dark:text-dark-text shadow-md p-4 flex justify-between items-center border-b border-light-border dark:border-dark-border">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className="md:hidden p-1 text-light-text dark:text-dark-text">
            <Bars3Icon className="h-6 w-6" />
          </button>
        )}
        <img 
          src="https://aisfizoyfpcisykarrnt.supabase.co/storage/v1/object/public/imagens/LOGO%20TRIAD3%20.png" 
          alt="Triad3 Logo" 
          className="h-10 w-10 rounded-full"
        />
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-background">
                <img src={user.photoUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt="user avatar" className="h-8 w-8 rounded-full object-cover bg-gray-200" />
                <span className="hidden sm:block font-medium">{user.name}</span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right bg-light-background dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <div className="px-4 py-3 border-b border-light-border dark:border-dark-border">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    to={getProfileLink()}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-background"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    Meu Perfil
                  </Link>
                   <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-background"
                  >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
