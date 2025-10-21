import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import type { User, Admin, Researcher, Company } from '../types';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';

type LoginStatus = 'SUCCESS' | 'INVALID_CREDENTIALS' | 'INACTIVE_ACCOUNT';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ status: LoginStatus, role?: UserRole }>;
  logout: () => void;
  updateUserProfile: (updatedData: Partial<Admin>) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  updateUserPhoto: (photoUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error reading user from localStorage", error);
      localStorage.removeItem('user');
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error("Error writing user to localStorage", error);
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<{ status: LoginStatus, role?: UserRole }> => {
    const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
    
    // NOTE: This is an insecure password check matching the mock data.
    // In a real application, use a secure hashing method and an edge function for verification.
    if (userError || !userData || userData.senha_hash !== password) {
        return { status: 'INVALID_CREDENTIALS' };
    }

    const { papel: dbRole, id_perfil: profileId } = userData;
    
    let profile: any = null; // Can be Admin, Researcher, or Company
    let frontendRole: UserRole | undefined = undefined;
    let name = '';
    let photoUrl: string | undefined = '';

    try {
        if (dbRole === 'admin') {
            frontendRole = UserRole.ADMIN;
            const { data, error } = await supabase.from('administradores').select('*').eq('id', profileId).single();
            if (error || !data) throw new Error("Profile not found");
            if (!data.esta_ativo) return { status: 'INACTIVE_ACCOUNT' };
            profile = data;
            name = data.nome;
            photoUrl = data.url_foto;
        } else if (dbRole === 'empresa') {
            frontendRole = UserRole.COMPANY;
            const { data, error } = await supabase.from('empresas').select('*').eq('id', profileId).single();
            if (error || !data) throw new Error("Profile not found");
            if (!data.esta_ativa) return { status: 'INACTIVE_ACCOUNT' };
            profile = data;
            name = data.nome;
            photoUrl = data.url_logo;
        } else if (dbRole === 'pesquisador') {
            frontendRole = UserRole.USER;
            const { data, error } = await supabase.from('pesquisadores').select('*').eq('id', profileId).single();
            if (error || !data) throw new Error("Profile not found");
            if (!data.esta_ativo) return { status: 'INACTIVE_ACCOUNT' };
            profile = data;
            name = data.nome;
            photoUrl = data.url_foto;
        } else {
            return { status: 'INVALID_CREDENTIALS' };
        }

        setUser({
            id: profile.id,
            email: userData.email,
            role: frontendRole!,
            profileId: profile.id,
            name: name,
            photoUrl: photoUrl
        });

        return { status: 'SUCCESS', role: frontendRole };

    } catch (error) {
        console.error("Login profile fetch error:", error);
        return { status: 'INVALID_CREDENTIALS' };
    }
  }, []);

  const logout = () => {
    setUser(null);
  };
  
  const updateUserProfile = async (updatedData: Partial<Admin>) => {
    if (!user || user.role !== 'admin') return;

    const { error } = await supabase
        .from('administradores')
        .update({ nome: updatedData.name, url_foto: updatedData.photoUrl })
        .eq('id', user.profileId);
    
    if (error) {
        alert('Falha ao atualizar perfil.');
        console.error(error);
    } else {
        setUser(prevUser => prevUser ? {
            ...prevUser,
            name: updatedData.name || prevUser.name,
            photoUrl: updatedData.photoUrl,
        } : null);
        alert('Perfil atualizado com sucesso!');
    }
  };

  const updateUserPhoto = async (photoUrl: string) => {
    if (!user) return;
    
    let table = '';
    let column = '';
    
    switch (user.role) {
        case UserRole.USER: // Researcher
            table = 'pesquisadores';
            column = 'url_foto';
            break;
        case UserRole.COMPANY:
            table = 'empresas';
            column = 'url_logo';
            break;
        default:
            return;
    }

    const { error } = await supabase
        .from(table)
        .update({ [column]: photoUrl })
        .eq('id', user.profileId);
    
    if (error) {
        alert('Falha ao atualizar a foto.');
        console.error(error);
    } else {
        setUser(prev => prev ? { ...prev, photoUrl } : null);
        alert('Foto atualizada com sucesso!');
    }
  };

  const updateUserPassword = async (password: string) => {
    if (!user) return;
    const { error } = await supabase
        .from('usuarios')
        .update({ senha_hash: password })
        .eq('id_perfil', user.profileId);
    
    if (error) {
        alert('Falha ao atualizar a senha.');
        console.error(error);
    } else {
        alert('Senha atualizada com sucesso!');
    }
  };

  const value = useMemo(() => ({ user, login, logout, updateUserProfile, updateUserPassword, updateUserPhoto }), [user, login]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};