// pages/ProfilePage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { UploadIcon } from '../components/icons/UploadIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';

const ProfilePage: React.FC = () => {
    const { user, updateUserPhoto, updateUserPassword } = useAuth();

    const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
    const [photoPreview, setPhotoPreview] = useState(user?.photoUrl || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
                setPhotoUrl(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !photoUrl || photoUrl === user.photoUrl) return;
        updateUserPhoto(photoUrl);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        if (newPassword.length < 3) {
            alert('A senha deve ter pelo menos 3 caracteres.');
            return;
        }
        updateUserPassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
    };
    
    const isCompany = user?.role === 'company';
    const photoLabel = isCompany ? 'Logo da Empresa' : 'Sua Foto';
    const changePhotoLabel = isCompany ? 'Alterar logo' : 'Alterar foto';
    const backLink = isCompany ? '/company/dashboard' : '/user/home';

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text">
            <Header title="Meu Perfil" />
            <main className="p-4 sm:p-8 max-w-4xl mx-auto">
                
                 <div className="mb-6">
                    <Link
                        to={backLink}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-light-primary dark:hover:text-dark-primary"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Voltar ao Painel
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Profile Details Form */}
                    <div className="bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-6">{isCompany ? 'Informações da Empresa' : 'Informações Pessoais'}</h2>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={photoPreview || `https://i.pravatar.cc/150?u=${user?.id}`}
                                    alt="Foto de perfil"
                                    className="h-20 w-20 rounded-full object-cover bg-gray-200 flex-shrink-0"
                                />
                                <div className="flex-grow">
                                    <label className="block text-sm font-medium mb-1">{photoLabel}</label>
                                    <label
                                        htmlFor="photo-upload-input"
                                        className="flex-grow cursor-pointer flex items-center gap-2 justify-center px-4 py-2 bg-white dark:bg-dark-background border border-gray-300 dark:border-dark-border rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-border"
                                    >
                                        <UploadIcon className="h-5 w-5"/>
                                        <span>{changePhotoLabel}</span>
                                    </label>
                                    <input id="photo-upload-input" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1">E-mail de Login</label>
                                <input type="email" id="email" value={user?.email || ''} className="w-full input-style bg-gray-100 dark:bg-dark-background" disabled />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold rounded-lg hover:opacity-90">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>

                    {/* Password Change Form */}
                    <div className="bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-6">Alterar Senha</h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="relative">
                                <label htmlFor="newPassword">Nova Senha</label>
                                <input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full input-style mt-1"
                                    required
                                />
                                 <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-8 pr-4 flex items-center text-gray-400 hover:text-light-primary dark:hover:text-white"
                                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                                >
                                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full input-style mt-1"
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold rounded-lg hover:opacity-90">Alterar Senha</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;