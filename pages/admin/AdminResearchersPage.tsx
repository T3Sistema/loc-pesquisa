// pages/admin/AdminResearchersPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { getResearchers, getFullCampaigns, getResponses } from '../../services/api';
import { supabase } from '../../services/supabase';
import type { Researcher, Campaign } from '../../types';
import Modal from '../../components/Modal';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { PencilIcon } from '../../components/icons/PencilIcon';
import { TrashIcon } from '../../components/icons/TrashIcon';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { LinkIcon } from '../../components/icons/LinkIcon';
import ResearcherModal from '../../components/ResearcherModal';
import AssignCampaignsModal from '../../components/AssignCampaignsModal';
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


const AdminResearchersPage: React.FC = () => {
    const [researchers, setResearchers] = useState<Researcher[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [responses, setResponses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isResearcherModalOpen, setIsResearcherModalOpen] = useState(false);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [editingResearcher, setEditingResearcher] = useState<Researcher | null>(null);
    const [researcherToDelete, setResearcherToDelete] = useState<Researcher | null>(null);
    const [researcherToToggle, setResearcherToToggle] = useState<Researcher | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [researchersData, campaignsData, responsesData] = await Promise.all([
                getResearchers(),
                getFullCampaigns(),
                getResponses(),
            ]);
            setResearchers(researchersData);
            setCampaigns(campaignsData);
            setResponses(responsesData);
        } catch (error) {
            console.error(error);
            alert("Falha ao carregar dados dos pesquisadores.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenResearcherModal = (researcher: Researcher | null) => {
        setEditingResearcher(researcher);
        setIsResearcherModalOpen(true);
    };
    
    const handleOpenCampaignModal = (researcher: Researcher) => {
        setEditingResearcher(researcher);
        setIsCampaignModalOpen(true);
    };

    const handleSaveResearcher = async (researcher: Researcher) => {
        const isCreating = !editingResearcher;
        const photoUrl = isCreating 
            ? (researcher.photoUrl || 'https://aisfizoyfpcisykarrnt.supabase.co/storage/v1/object/public/prospectaifeedback/Screenshot%202025-08-25%20182827.png')
            : researcher.photoUrl;

        const researcherData = {
            nome: researcher.name,
            email: researcher.email.toLowerCase(),
            telefone: researcher.phone,
            genero: researcher.gender,
            data_nascimento: researcher.dob,
            url_foto: photoUrl,
            esta_ativo: researcher.isActive,
            cor: researcher.color,
        };

        if (editingResearcher) {
            const { error: researcherError } = await supabase.from('pesquisadores').update(researcherData).eq('id', researcher.id);
            if (researcherError) {
                alert("Falha ao atualizar pesquisador.");
                return;
            }

            if(researcher.email !== editingResearcher.email) {
                const { error: userError } = await supabase.from('usuarios').update({ email: researcher.email.toLowerCase() }).eq('id_perfil', researcher.id);
                if (userError) alert('Perfil do pesquisador atualizado, mas falha ao atualizar o e-mail de login.');
            }

        } else {
            const { data: newResearcher, error: researcherError } = await supabase.from('pesquisadores').insert(researcherData).select().single();
            if (researcherError || !newResearcher) {
                alert(`Falha ao criar pesquisador: ${researcherError?.message}`);
                return;
            }

            const { error: userError } = await supabase.from('usuarios').insert({
                email: newResearcher.email.toLowerCase(),
                senha_hash: '123', // Senha Padrão
                papel: 'pesquisador',
                id_perfil: newResearcher.id,
            });

            if (userError) {
                alert(`Perfil do pesquisador criado, mas falha ao criar o usuário para login: ${userError.message}`);
            }
        }
        
        fetchData();
        setIsResearcherModalOpen(false);
        setEditingResearcher(null);
    };
    
    const handleSaveCampaignAssignments = async (researcher: Researcher, assignedCampaignIds: string[]) => {
        // Remove all assignments for this researcher
        await supabase.from('campanhas_pesquisadores').delete().eq('id_pesquisador', researcher.id);
        
        // Add new assignments
        if (assignedCampaignIds.length > 0) {
            const assignments = assignedCampaignIds.map(campaignId => ({
                id_campanha: campaignId,
                id_pesquisador: researcher.id
            }));
            await supabase.from('campanhas_pesquisadores').insert(assignments);
        }
        
        fetchData();
        setIsCampaignModalOpen(false);
    };

    const requestToggleActive = (researcher: Researcher) => {
        setResearcherToToggle(researcher);
    };

    const confirmToggleActive = async () => {
        if (researcherToToggle) {
            const { error } = await supabase.from('pesquisadores').update({ esta_ativo: !researcherToToggle.isActive }).eq('id', researcherToToggle.id);
            if (error) {
                alert('Falha ao atualizar status.');
            } else {
                fetchData();
            }
            setResearcherToToggle(null);
        }
    };

    const handleDelete = (researcher: Researcher) => {
        setResearcherToDelete(researcher);
    };

    const confirmDelete = async () => {
        if (researcherToDelete) {
            const { error: userError } = await supabase.from('usuarios').delete().eq('id_perfil', researcherToDelete.id);
            if (userError) {
                alert(`Falha ao excluir o acesso do usuário: ${userError.message}`);
                setResearcherToDelete(null);
                return;
            }
            
            const { error: researcherError } = await supabase.from('pesquisadores').delete().eq('id', researcherToDelete.id);
            if (researcherError) {
                alert(`Falha ao excluir o perfil do pesquisador: ${researcherError.message}`);
            } else {
                fetchData();
            }
            setResearcherToDelete(null);
        }
    };
    
    const researcherStats = useMemo(() => {
        const stats: Record<string, { assignedCampaigns: number; completedSurveys: number }> = {};
        researchers.forEach(researcher => {
            const assignedCampaigns = campaigns.filter(c => c.researcherIds?.includes(researcher.id)).length;
            const completedSurveys = responses.filter(r => r.researcherId === researcher.id).length;
            stats[researcher.id] = { assignedCampaigns, completedSurveys };
        });
        return stats;
    }, [researchers, campaigns, responses]);

     const { total, active, inactive } = useMemo(() => {
        const total = researchers.length;
        const active = researchers.filter(r => r.isActive).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [researchers]);
    
    const filteredResearchers = useMemo(() => {
        let tempResearchers = [...researchers];

        if (statusFilter !== 'all') {
            tempResearchers = tempResearchers.filter(r => statusFilter === 'active' ? r.isActive : !r.isActive);
        }

        if (searchQuery) {
            tempResearchers = tempResearchers.filter(r =>
                r.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        return tempResearchers.sort((a, b) => a.name.localeCompare(b.name));
    }, [researchers, searchQuery, statusFilter]);

    if(isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full py-10">
                <LoadingSpinner text="Carregando pesquisadores" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">Gerenciar Pesquisadores</h1>
                <button onClick={() => handleOpenResearcherModal(null)} className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">
                    <PlusIcon className="h-5 w-5"/>
                    <span className="hidden sm:inline">Adicionar Pesquisador</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard title="Total de Pesquisadores" value={total} icon={UserGroupIcon} color="bg-blue-500" />
                <StatCard title="Pesquisadores Ativos" value={active} icon={UserCheckIcon} color="bg-success" />
                <StatCard title="Pesquisadores Inativos" value={inactive} icon={UserXIcon} color="bg-error" />
            </div>

             <div className="mb-8 max-w-lg flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="search-researcher"
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

            <ResearcherModal
                isOpen={isResearcherModalOpen}
                onClose={() => setIsResearcherModalOpen(false)}
                onSave={handleSaveResearcher}
                researcher={editingResearcher}
            />

            {editingResearcher && (
                <AssignCampaignsModal
                    isOpen={isCampaignModalOpen}
                    onClose={() => setIsCampaignModalOpen(false)}
                    researcher={editingResearcher}
                    onSave={handleSaveCampaignAssignments}
                />
            )}
            
            <Modal isOpen={!!researcherToDelete} onClose={() => setResearcherToDelete(null)} title="Confirmar Exclusão">
                <p>Tem certeza que deseja excluir o pesquisador "<strong>{researcherToDelete?.name}</strong>"? O acesso de login também será removido.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setResearcherToDelete(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-error text-white rounded-lg hover:opacity-90">Excluir</button>
                </div>
            </Modal>
            
             <Modal isOpen={!!researcherToToggle} onClose={() => setResearcherToToggle(null)} title="Confirmar Alteração de Status">
                {researcherToToggle && (
                    <div>
                        <p>Tem certeza que deseja{' '}
                            <strong className={researcherToToggle.isActive ? 'text-error' : 'text-success'}>
                                {researcherToToggle.isActive ? 'DESATIVAR' : 'ATIVAR'}
                            </strong>{' '}
                            o pesquisador "<strong>{researcherToToggle.name}</strong>"?
                        </p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setResearcherToToggle(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                            <button onClick={confirmToggleActive} className={`px-4 py-2 text-white rounded-lg hover:opacity-90 ${researcherToToggle.isActive ? 'bg-error' : 'bg-success'}`}>
                                {researcherToToggle.isActive ? 'Sim, Desativar' : 'Sim, Ativar'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResearchers.map(r => {
                    const stats = researcherStats[r.id] || { assignedCampaigns: 0, completedSurveys: 0 };
                    return (
                        <div key={r.id} className="bg-light-background dark:bg-dark-card rounded-lg shadow-md flex flex-col">
                            <div className="p-5 flex-grow">
                                <header className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        <img src={r.photoUrl || 'https://i.pravatar.cc/150?u=placeholder'} alt={r.name} className="h-16 w-16 rounded-full object-cover" />
                                        <div>
                                            <h3 className="text-lg font-bold text-light-primary">{r.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{r.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end flex-shrink-0">
                                        <ToggleSwitch checked={r.isActive} onChange={() => requestToggleActive(r)} />
                                        <span className={`text-xs mt-1 ${r.isActive ? 'text-success' : 'text-gray-500'}`}>{r.isActive ? 'Ativo' : 'Inativo'}</span>
                                    </div>
                                </header>
                                
                                <div className="grid grid-cols-2 gap-4 text-center my-4 py-3 border-y border-light-border dark:border-dark-border">
                                    <div>
                                        <p className="text-2xl font-bold">{stats.assignedCampaigns}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Campanhas Vinculadas</p>
                                    </div>
                                     <div>
                                        <p className="text-2xl font-bold">{stats.completedSurveys}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Pesquisas Realizadas</p>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => handleOpenCampaignModal(r)}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-gray-200 dark:bg-dark-background hover:bg-gray-300 dark:hover:bg-dark-border transition-colors text-sm font-semibold"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                    Vincular Campanhas
                                </button>
                            </div>
                            
                            <footer className="px-5 pb-4 flex justify-end items-center gap-2">
                                <button onClick={() => handleOpenResearcherModal(r)} className="p-2 text-gray-500 hover:text-light-primary hover:bg-gray-200 dark:hover:bg-dark-border rounded-full transition-colors"><PencilIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleDelete(r)} className="p-2 text-gray-500 hover:text-error hover:bg-gray-200 dark:hover:bg-dark-border rounded-full transition-colors"><TrashIcon className="h-5 w-5"/></button>
                            </footer>
                        </div>
                    );
                })}
            </div>
             {filteredResearchers.length === 0 && (
                <div className="text-center py-12 bg-light-background dark:bg-dark-card rounded-lg shadow-md">
                    <p className="text-lg text-gray-600 dark:text-gray-400">Nenhum pesquisador encontrado.</p>
                    <p className="text-sm text-gray-500 mt-2">Tente ajustar sua busca ou adicione um novo pesquisador.</p>
                </div>
            )}
        </div>
    );
};

export default AdminResearchersPage;
