// pages/admin/AdminCampaignsPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Campaign, Company, Voucher, SurveyResponse } from '../../types';
import { getFullCampaigns, getCompanies, getVouchers, getResponses } from '../../services/api';
import { supabase } from '../../services/supabase';
import Modal from '../../components/Modal';
import QRCodeDisplay from '../../components/QRCodeDisplay';
import { PencilIcon } from '../../components/icons/PencilIcon';
import { TrashIcon } from '../../components/icons/TrashIcon';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { MagnifyingGlassIcon } from '../../components/icons/MagnifyingGlassIcon';
import { ArrowDownIcon } from '../../components/icons/ArrowDownIcon';
import { CampaignQuestionsView } from '../../components/CampaignQuestionsView';
import { UserGroupIcon } from '../../components/icons/UserGroupIcon';
import { UserCheckIcon } from '../../components/icons/UserCheckIcon';
import { UserXIcon } from '../../components/icons/UserXIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BuildingOfficeIcon } from '../../components/icons/BuildingOfficeIcon';

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

const AdminCampaignsPage: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
    const [campaignToToggle, setCampaignToToggle] = useState<Campaign | null>(null);
    const [selectedCampaignForQr, setSelectedCampaignForQr] = useState<Campaign | null>(null);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [campaignStatusFilter, setCampaignStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [companyFilterId, setCompanyFilterId] = useState<string>('all');
    const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [campaignsData, companiesData, vouchersData, responsesData] = await Promise.all([
          getFullCampaigns(),
          getCompanies(),
          getVouchers(),
          getResponses(),
        ]);
        setCampaigns(campaignsData);
        setCompanies(companiesData);
        setVouchers(vouchersData);
        setResponses(responsesData);
      } catch (error) {
        console.error("Failed to fetch page data", error);
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleCampaignExpand = (campaignId: string) => {
        setExpandedCampaignId(prevId => (prevId === campaignId ? null : campaignId));
    };

    const handleDeleteClick = (campaign: Campaign) => {
        setCampaignToDelete(campaign);
    };

    const handleConfirmDelete = async () => {
        if (campaignToDelete) {
            const { error } = await supabase.from('campanhas').delete().eq('id', campaignToDelete.id);
            if (error) {
                alert("Falha ao deletar campanha.");
                console.error(error);
            } else {
                setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete.id));
            }
            setCampaignToDelete(null);
        }
    };
    
    const requestToggleActive = (campaign: Campaign) => {
        setCampaignToToggle(campaign);
    };

    const confirmToggleActive = async () => {
        if (campaignToToggle) {
            const newStatus = !campaignToToggle.isActive;
            const { error } = await supabase.from('campanhas').update({ esta_ativa: newStatus }).eq('id', campaignToToggle.id);
            if (error) {
                alert("Falha ao atualizar status.");
            } else {
                setCampaigns(campaigns.map(c => c.id === campaignToToggle.id ? { ...c, isActive: newStatus } : c));
            }
            setCampaignToToggle(null);
        }
    };

    const handleShowQrCode = (campaign: Campaign) => {
        setSelectedCampaignForQr(campaign);
        setIsQrModalOpen(true);
    };

    const getVouchersForCampaign = (campaign: Campaign) => {
        const activeCompanyIds = companies.filter(c => c.isActive).map(c => c.id);
        const campaignActiveCompanies = campaign.companyIds.filter(id => activeCompanyIds.includes(id));
        return vouchers.filter(v => v.isActive && campaignActiveCompanies.includes(v.companyId));
    }

    const getRewardsUrl = (campaignId: string) => {
        const url = new URL(window.location.href);
        return `${url.origin}${url.pathname}#/rewards/${campaignId}`;
    };

    const getResponseCountForCampaign = (campaignId: string) => {
        return responses.filter(r => r.campaignId === campaignId).length;
    }

    const { total, active, inactive } = useMemo(() => {
        const total = campaigns.length;
        const active = campaigns.filter(c => c.isActive).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [campaigns]);

    const filteredCampaigns = useMemo(() => {
        let tempCampaigns = [...campaigns];

        if (campaignStatusFilter !== 'all') {
            tempCampaigns = tempCampaigns.filter(c => campaignStatusFilter === 'active' ? c.isActive : !c.isActive);
        }
        
        if (companyFilterId !== 'all') {
            tempCampaigns = tempCampaigns.filter(c => c.companyIds.includes(companyFilterId));
        }

        if (searchQuery) {
            tempCampaigns = tempCampaigns.filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.theme.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return [...tempCampaigns].sort((a, b) => a.name.localeCompare(b.name));
    }, [searchQuery, campaigns, campaignStatusFilter, companyFilterId]);

    if(isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full py-10">
                <LoadingSpinner text="Carregando campanhas" />
            </div>
        );
    }

    return (
        <div>
            <style>{`.input-style { background-color: white; border: 1px solid #e2e8f0; border-radius: 0.375rem; } .dark .input-style { background-color: #1F2937; border-color: #374151; }`}</style>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">Gerenciar Campanhas</h1>
                <button 
                    onClick={() => navigate('/admin/campaigns/new')} 
                    className="bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                    Criar Nova Campanha
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard title="Total de Campanhas" value={total} icon={UserGroupIcon} color="bg-blue-500" />
                <StatCard title="Campanhas Ativas" value={active} icon={UserCheckIcon} color="bg-success" />
                <StatCard title="Campanhas Inativas" value={inactive} icon={UserXIcon} color="bg-error" />
            </div>

            <div className="mb-8 max-w-full flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="search-campaign"
                        type="text"
                        placeholder="Buscar por nome da campanha..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full input-style py-2 pr-3 pl-10"
                    />
                </div>
                <select
                    value={companyFilterId}
                    onChange={(e) => setCompanyFilterId(e.target.value)}
                    className="block w-full sm:w-auto px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-light-primary focus:border-light-primary text-sm"
                >
                    <option value="all">Todas as Empresas</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                    value={campaignStatusFilter}
                    onChange={(e) => setCampaignStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="block w-full sm:w-auto px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-light-primary focus:border-light-primary text-sm"
                >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativas</option>
                    <option value="inactive">Inativas</option>
                </select>
            </div>

            {selectedCampaignForQr && (
                <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="Compartilhar Campanha">
                    <QRCodeDisplay
                        title={selectedCampaignForQr.name}
                        qrCodeValue={selectedCampaignForQr.finalRedirectUrl || getRewardsUrl(selectedCampaignForQr.id)}
                        shareUrl={selectedCampaignForQr.finalRedirectUrl || getRewardsUrl(selectedCampaignForQr.id)}
                        vouchers={selectedCampaignForQr.finalRedirectUrl ? [] : getVouchersForCampaign(selectedCampaignForQr)}
                        companies={companies}
                    />
                </Modal>
            )}
            
            <Modal isOpen={!!campaignToDelete} onClose={() => setCampaignToDelete(null)} title="Confirmar Exclusão">
                <p>Tem certeza que deseja excluir a campanha "<strong>{campaignToDelete?.name}</strong>"? Esta ação não pode ser desfeita.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setCampaignToDelete(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                    <button onClick={handleConfirmDelete} className="px-4 py-2 bg-error text-white rounded-lg hover:opacity-90">Excluir</button>
                </div>
            </Modal>

            <Modal isOpen={!!campaignToToggle} onClose={() => setCampaignToToggle(null)} title="Confirmar Alteração de Status">
              {campaignToToggle && (
                  <div>
                      <p>
                          Tem certeza que deseja{' '}
                          <strong className={campaignToToggle.isActive ? 'text-error' : 'text-success'}>
                              {campaignToToggle.isActive ? 'DESATIVAR' : 'ATIVAR'}
                          </strong>{' '}
                          a campanha "<strong>{campaignToToggle.name}</strong>"?
                      </p>
                      <div className="flex justify-end gap-4 mt-6">
                          <button onClick={() => setCampaignToToggle(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                          <button onClick={confirmToggleActive} className={`px-4 py-2 text-white rounded-lg hover:opacity-90 ${campaignToToggle.isActive ? 'bg-error' : 'bg-success'}`}>
                              {campaignToToggle.isActive ? 'Sim, Desativar' : 'Sim, Ativar'}
                          </button>
                      </div>
                  </div>
              )}
            </Modal>

            <div className="space-y-4">
                {filteredCampaigns.map(campaign => {
                    const isCampaignExpanded = expandedCampaignId === campaign.id;
                    const linkedCompanies = companies.filter(c => campaign.companyIds.includes(c.id));
                    return (
                        <div key={campaign.id} className="bg-light-background dark:bg-dark-card rounded-lg shadow-md transition-all duration-300">
                             <div 
                                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-background/50 rounded-t-lg"
                                onClick={() => handleToggleCampaignExpand(campaign.id)}
                                role="button"
                                aria-expanded={isCampaignExpanded}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-lg text-light-primary truncate">{campaign.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{campaign.theme}</p>
                                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                        <div>
                                            <span className="font-semibold text-light-text dark:text-dark-text">Progresso:</span>
                                            <span className="font-mono ml-1">{getResponseCountForCampaign(campaign.id)} / {campaign.responseGoal}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                            <span className="font-semibold text-light-text dark:text-dark-text">{linkedCompanies.length}</span>
                                            <span>{linkedCompanies.length === 1 ? 'Empresa Vinculada' : 'Empresas Vinculadas'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto justify-end">
                                    <div className="flex flex-col items-center">
                                        <ToggleSwitch checked={campaign.isActive} onChange={() => requestToggleActive(campaign)} />
                                        <span className={`text-xs mt-1 ${campaign.isActive ? 'text-success' : 'text-gray-500'}`}>{campaign.isActive ? 'Ativa' : 'Inativa'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/campaigns/edit/${campaign.id}`); }} className="p-2 text-gray-500 hover:text-light-primary hover:bg-gray-100 dark:hover:bg-dark-border rounded-full transition-colors"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(campaign); }} className="p-2 text-gray-500 hover:text-error hover:bg-gray-100 dark:hover:bg-dark-border rounded-full transition-colors"><TrashIcon className="h-5 w-5"/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleShowQrCode(campaign); }} className="bg-dark-secondary text-white font-semibold py-1.5 px-3 rounded-md hover:opacity-90 transition-opacity text-sm">QR Code</button>
                                    </div>
                                    <ArrowDownIcon className={`h-5 w-5 text-gray-400 transform transition-transform duration-300 ${isCampaignExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCampaignExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
                                <div className="p-5 border-t border-light-border dark:border-dark-border grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-1">
                                        <h4 className="text-md font-bold text-light-text dark:text-dark-text mb-3 flex items-center gap-2">
                                            <BuildingOfficeIcon className="h-5 w-5" />
                                            Empresas Vinculadas
                                        </h4>
                                        <div className="space-y-2">
                                            {linkedCompanies.length > 0 ? linkedCompanies.map(c => (
                                                <div key={c.id} className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-dark-background rounded-md">
                                                    <img src={c.logoUrl} alt={c.name} className="h-8 w-8 rounded-full object-cover" />
                                                    <span className="text-sm font-medium">{c.name}</span>
                                                </div>
                                            )) : (
                                                <p className="text-sm text-gray-500">Nenhuma empresa vinculada.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                         <CampaignQuestionsView questions={campaign.questions} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                 {filteredCampaigns.length === 0 && (
                    <div className="text-center py-12 bg-light-background dark:bg-dark-card rounded-lg shadow-md">
                        <p className="text-lg text-gray-600 dark:text-gray-400">Nenhuma campanha encontrada.</p>
                        <p className="text-sm text-gray-500 mt-2">Tente ajustar seus filtros ou crie uma nova campanha.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCampaignsPage;