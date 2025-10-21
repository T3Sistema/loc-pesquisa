// pages/admin/AdminAdministratorsPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { getAdmins } from '../../services/api';
import { supabase } from '../../services/supabase';
import type { Admin } from '../../types';
import Modal from '../../components/Modal';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { PencilIcon } from '../../components/icons/PencilIcon';
import { TrashIcon } from '../../components/icons/TrashIcon';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import AdminModal from '../../components/AdminModal';
import { MagnifyingGlassIcon } from '../../components/icons/MagnifyingGlassIcon';
import { UserGroupIcon } from '../../components/icons/UserGroupIcon';
import { UserCheckIcon } from '../../components/icons/UserCheckIcon';
import { UserXIcon } from '../../components/icons/UserXIcon';
import LoadingSpinner from '../../components/LoadingSpinner';

const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType, color: string }> = ({ title, value, icon: Icon, color }) => {
    return (
        <div className="bg-light-background dark:bg-dark-card p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}

const AdminAdministratorsPage: React.FC = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
    const [adminToToggle, setAdminToToggle] = useState<Admin | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getAdmins();
            setAdmins(data);
        } catch(e) {
            console.error(e);
            alert('Falha ao buscar administradores.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (admin: Admin | null) => {
        setEditingAdmin(admin);
        setIsModalOpen(true);
    };

    const handleSaveAdmin = async (admin: Admin) => {
        const isCreating = !editingAdmin;
        const photoUrl = isCreating
            ? (admin.photoUrl || 'https://aisfizoyfpcisykarrnt.supabase.co/storage/v1/object/public/prospectaifeedback/Screenshot%202025-08-25%20182827.png')
            : admin.photoUrl;

        const adminData = {
            nome: admin.name,
            email: admin.email.toLowerCase(),
            telefone: admin.phone,
            data_nascimento: admin.dob,
            url_foto: photoUrl,
            esta_ativo: admin.isActive,
        };

        if (editingAdmin) {
            const { error: adminError } = await supabase.from('administradores').update(adminData).eq('id', admin.id);
            if(adminError) {
                alert('Falha ao atualizar administrador.');
                return;
            }
            if(admin.email !== editingAdmin.email) {
                const { error: userError } = await supabase.from('usuarios').update({ email: admin.email.toLowerCase() }).eq('id_perfil', admin.id);
                if (userError) alert('Perfil atualizado, mas falha ao atualizar o e-mail de login.');
            }
        } else {
            const { data: newAdmin, error: adminError } = await supabase.from('administradores').insert(adminData).select().single();
            if(adminError || !newAdmin) {
                alert(`Falha ao criar administrador: ${adminError?.message}`);
                return;
            }

            const { error: userError } = await supabase.from('usuarios').insert({
                email: newAdmin.email.toLowerCase(),
                senha_hash: '123', // Senha Padrão
                papel: 'admin',
                id_perfil: newAdmin.id,
            });

            if (userError) {
                alert(`Perfil de administrador criado, mas falha ao criar o usuário para login: ${userError.message}`);
            }
        }
        fetchData();
        setIsModalOpen(false);
        setEditingAdmin(null);
    };
    
    const requestToggleActive = (admin: Admin) => {
        setAdminToToggle(admin);
    };

    const confirmToggleActive = async () => {
        if (adminToToggle) {
            const { error } = await supabase.from('administradores').update({ esta_ativo: !adminToToggle.isActive }).eq('id', adminToToggle.id);
            if(error) {
                alert('Falha ao atualizar status.');
            } else {
                fetchData();
            }
            setAdminToToggle(null);
        }
    };

    const handleDelete = (admin: Admin) => {
        setAdminToDelete(admin);
    };

    const confirmDelete = async () => {
        if (adminToDelete) {
            const { error: userError } = await supabase.from('usuarios').delete().eq('id_perfil', adminToDelete.id);
            if (userError) {
                alert(`Falha ao excluir o acesso do usuário: ${userError.message}`);
                setAdminToDelete(null);
                return;
            }
            
            const { error: adminError } = await supabase.from('administradores').delete().eq('id', adminToDelete.id);
            if(adminError) {
                alert(`Falha ao excluir o perfil do administrador: ${adminError.message}`);
            } else {
                fetchData();
            }
            setAdminToDelete(null);
        }
    };

    const { total, active, inactive } = useMemo(() => {
        const total = admins.length;
        const active = admins.filter(r => r.isActive).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [admins]);
    
    const filteredAdmins = useMemo(() => {
        let tempAdmins = [...admins];

        if (statusFilter !== 'all') {
            tempAdmins = tempAdmins.filter(r => statusFilter === 'active' ? r.isActive : !r.isActive);
        }

        if (searchQuery) {
            tempAdmins = tempAdmins.filter(r =>
                r.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        return tempAdmins.sort((a, b) => a.name.localeCompare(b.name));
    }, [admins, searchQuery, statusFilter]);

    if(isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full py-10">
                <LoadingSpinner text="Carregando administradores" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">Gerenciar Administradores</h1>
                <button onClick={() => handleOpenModal(null)} className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">
                    <PlusIcon className="h-5 w-5"/>
                    <span className="hidden sm:inline">Adicionar Administrador</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard title="Total de Admins" value={total} icon={UserGroupIcon} color="bg-blue-500" />
                <StatCard title="Admins Ativos" value={active} icon={UserCheckIcon} color="bg-success" />
                <StatCard title="Admins Inativos" value={inactive} icon={UserXIcon} color="bg-error" />
            </div>

             <div className="mb-8 max-w-lg flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="search-admin"
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-light-background dark:bg-dark-card py-2 pr-3 pl-10 border border-light-border dark:border-dark-border rounded-lg"
                    />
                </div>
                 <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="block w-full sm:w-auto px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-light-primary focus:border-light-primary text-sm"
                >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>
            </div>

            <AdminModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAdmin}
                admin={editingAdmin}
            />
            
            <Modal isOpen={!!adminToDelete} onClose={() => setAdminToDelete(null)} title="Confirmar Exclusão">
                <p>Tem certeza que deseja excluir o administrador "<strong>{adminToDelete?.name}</strong>"? O acesso de login também será removido.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setAdminToDelete(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-error text-white rounded-lg hover:opacity-90">Excluir</button>
                </div>
            </Modal>
            
             <Modal isOpen={!!adminToToggle} onClose={() => setAdminToToggle(null)} title="Confirmar Alteração de Status">
                {adminToToggle && (
                    <div>
                        <p>Tem certeza que deseja{' '}
                            <strong className={adminToToggle.isActive ? 'text-error' : 'text-success'}>
                                {adminToToggle.isActive ? 'DESATIVAR' : 'ATIVAR'}
                            </strong>{' '}
                            o administrador "<strong>{adminToToggle.name}</strong>"?
                        </p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setAdminToToggle(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                            <button onClick={confirmToggleActive} className={`px-4 py-2 text-white rounded-lg hover:opacity-90 ${adminToToggle.isActive ? 'bg-error' : 'bg-success'}`}>
                                {adminToToggle.isActive ? 'Sim, Desativar' : 'Sim, Ativar'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAdmins.map(admin => (
                    <div key={admin.id} className="bg-light-background dark:bg-dark-card rounded-lg shadow-md flex flex-col">
                        <div className="p-5 flex-grow">
                            <header className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <img src={admin.photoUrl || 'https://i.pravatar.cc/150?u=placeholder'} alt={admin.name} className="h-16 w-16 rounded-full object-cover" />
                                    <div>
                                        <h3 className="text-lg font-bold text-light-primary">{admin.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{admin.email}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{admin.phone}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <ToggleSwitch checked={admin.isActive} onChange={() => requestToggleActive(admin)} />
                                    <span className={`text-xs mt-1 ${admin.isActive ? 'text-success' : 'text-gray-500'}`}>{admin.isActive ? 'Ativo' : 'Inativo'}</span>
                                </div>
                            </header>
                        </div>
                        
                        <footer className="px-5 pb-4 flex justify-end items-center gap-2 border-t border-light-border dark:border-dark-border pt-3">
                            <button onClick={() => handleOpenModal(admin)} className="p-2 text-gray-500 hover:text-light-primary hover:bg-gray-200 dark:hover:bg-dark-border rounded-full transition-colors"><PencilIcon className="h-5 w-5"/></button>
                            <button onClick={() => handleDelete(admin)} className="p-2 text-gray-500 hover:text-error hover:bg-gray-200 dark:hover:bg-dark-border rounded-full transition-colors"><TrashIcon className="h-5 w-5"/></button>
                        </footer>
                    </div>
                ))}
            </div>
             {filteredAdmins.length === 0 && (
                <div className="text-center py-12 bg-light-background dark:bg-dark-card rounded-lg shadow-md">
                    <p className="text-lg text-gray-600 dark:text-gray-400">Nenhum administrador encontrado.</p>
                    <p className="text-sm text-gray-500 mt-2">Tente ajustar sua busca ou adicione um novo administrador.</p>
                </div>
            )}
        </div>
    );
};

export default AdminAdministratorsPage;
