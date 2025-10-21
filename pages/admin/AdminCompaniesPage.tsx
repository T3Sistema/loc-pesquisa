// pages/admin/AdminCompaniesPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { getCompanies, getFullCampaigns } from '../../services/api';
import { supabase } from '../../services/supabase';
import type { Company, Campaign } from '../../types';
import Modal from '../../components/Modal';
import { CompanyVoucherManager } from '../../components/CompanyVoucherManager';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { PencilIcon } from '../../components/icons/PencilIcon';
import { TrashIcon } from '../../components/icons/TrashIcon';
import { TagIcon } from '../../components/icons/TagIcon';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { BuildingOfficeIcon } from '../../components/icons/BuildingOfficeIcon';
import { UserCheckIcon } from '../../components/icons/UserCheckIcon';
import { UserXIcon } from '../../components/icons/UserXIcon';
import { ArrowDownIcon } from '../../components/icons/ArrowDownIcon';
import { UploadIcon } from '../../components/icons/UploadIcon';
import LoadingSpinner from '../../components/LoadingSpinner';

const emptyCompany: Omit<Company, 'id' | 'creationDate' | 'isActive'> = {
    name: '',
    logoUrl: '',
    cnpj: '',
    contactEmail: '',
    contactPhone: '',
    contactPerson: '',
    instagram: '',
};

const CompanyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Partial<Company>) => void;
  company: Company | null;
}> = ({ isOpen, onClose, onSave, company }) => {
    const [formData, setFormData] = useState<Partial<Company>>(company || emptyCompany);
    
    React.useEffect(() => {
        setFormData(company || emptyCompany);
    }, [company, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const companyToSave : Partial<Company> = {
            ...emptyCompany,
            ...formData,
            creationDate: company?.creationDate || new Date().toISOString(),
            isActive: company?.isActive ?? true,
        };
        if (company?.id) {
            (companyToSave as Company).id = company.id;
        }
        onSave(companyToSave);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={company ? 'Editar Empresa' : 'Adicionar Nova Empresa'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Logo da Empresa</label>
                    <div className="flex items-center gap-4 mt-2">
                        {formData.logoUrl ? 
                           <img src={formData.logoUrl} alt="Preview" className="h-16 w-16 rounded-full object-cover bg-gray-200 flex-shrink-0" /> :
                           <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-dark-background flex items-center justify-center text-gray-400">
                                <BuildingOfficeIcon className="h-8 w-8"/>
                           </div>
                        }
                         <label htmlFor="logo-upload" className="flex-grow cursor-pointer flex items-center gap-2 justify-center px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-background">
                           <UploadIcon className="h-5 w-5"/>
                           <span>Upload de arquivo</span>
                        </label>
                        <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </div>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Nome da Empresa</label>
                    <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="w-full input-style" required/>
                </div>
                 <div>
                    <label htmlFor="cnpj" className="block text-sm font-medium mb-1">CNPJ</label>
                    <input type="text" id="cnpj" name="cnpj" value={formData.cnpj || ''} onChange={handleChange} className="w-full input-style"/>
                </div>
                <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium mb-1">E-mail de Contato (para login)</label>
                    <input type="email" id="contactEmail" name="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className="w-full input-style" required/>
                </div>
                <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium mb-1">Telefone de Contato</label>
                    <input type="tel" id="contactPhone" name="contactPhone" value={formData.contactPhone || ''} onChange={handleChange} className="w-full input-style"/>
                </div>
                 <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium mb-1">Pessoa de Contato</label>
                    <input type="text" id="contactPerson" name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} className="w-full input-style"/>
                </div>
                <div>
                    <label htmlFor="instagram" className="block text-sm font-medium mb-1">Instagram (Opcional)</label>
                    <input type="text" id="instagram" name="instagram" value={formData.instagram || ''} onChange={handleChange} className="w-full input-style" placeholder="@nomedaempresa"/>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold rounded-lg hover:opacity-90">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

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

const AdminCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyToToggle, setCompanyToToggle] = useState<Company | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [companiesData, campaignsData] = await Promise.all([getCompanies(), getFullCampaigns()]);
        setCompanies(companiesData);
        setCampaigns(campaignsData);
    } catch (error) {
        console.error("Failed to fetch data", error);
        alert("Falha ao carregar dados.");
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleExpand = (companyId: string) => {
    setExpandedCompanyId(prevId => (prevId === companyId ? null : companyId));
  };

  const requestToggleActive = (company: Company) => {
    setCompanyToToggle(company);
  };

  const confirmToggleActive = async () => {
    if (companyToToggle) {
        const { error } = await supabase
            .from('empresas')
            .update({ esta_ativa: !companyToToggle.isActive })
            .eq('id', companyToToggle.id);
        
        if (error) {
            alert("Falha ao atualizar status da empresa.");
        } else {
            fetchData(); // Re-fetch to get latest state
        }
        setCompanyToToggle(null);
    }
  };
  
  const handleOpenModal = (company: Company | null) => {
      setEditingCompany(company);
      setIsModalOpen(true);
  }
  
  const handleSaveCompany = async (company: Partial<Company>) => {
      const isCreating = !editingCompany;
      const logoUrl = isCreating 
        ? (company.logoUrl || 'https://aisfizoyfpcisykarrnt.supabase.co/storage/v1/object/public/prospectaifeedback/Screenshot%202025-08-25%20182827.png') 
        : company.logoUrl;

      const companyDataForDb = {
        nome: company.name,
        url_logo: logoUrl,
        cnpj: company.cnpj,
        email_contato: company.contactEmail?.toLowerCase(),
        telefone_contato: company.contactPhone,
        pessoa_contato: company.contactPerson,
        instagram: company.instagram,
        esta_ativa: company.isActive,
      };

      if (editingCompany && 'id' in company) {
        const { error: companyError } = await supabase.from('empresas').update(companyDataForDb).eq('id', company.id);
        if (companyError) {
          alert("Falha ao atualizar empresa.");
          return;
        }

        if (company.contactEmail && company.contactEmail !== editingCompany.contactEmail) {
            const { error: userError } = await supabase.from('usuarios').update({ email: company.contactEmail.toLowerCase() }).eq('id_perfil', company.id);
            if (userError) alert('Perfil da empresa atualizado, mas falha ao atualizar o e-mail de login.');
        }

      } else {
        const { data: newCompany, error: companyError } = await supabase.from('empresas').insert(companyDataForDb).select().single();
        if (companyError || !newCompany) {
            alert(`Falha ao criar empresa: ${companyError?.message}`);
            return;
        }

        const { error: userError } = await supabase.from('usuarios').insert({
            email: newCompany.email_contato.toLowerCase(),
            senha_hash: '123', // Senha Padrão
            papel: 'empresa',
            id_perfil: newCompany.id,
        });

        if (userError) {
            alert(`Perfil da empresa criado, mas falha ao criar o usuário para login: ${userError.message}`);
        }
      }
      
      fetchData();
      setIsModalOpen(false);
      setEditingCompany(null);
  }
  
  const handleDelete = (company: Company) => {
      setCompanyToDelete(company);
  }

  const confirmDelete = async () => {
      if (companyToDelete) {
          // Primeiro, exclui o usuário para evitar violação de chave estrangeira
          const { error: userError } = await supabase.from('usuarios').delete().eq('id_perfil', companyToDelete.id);
          if (userError) {
              alert(`Falha ao excluir o acesso do usuário: ${userError.message}`);
              setCompanyToDelete(null);
              return;
          }

          // Depois, exclui a empresa
          const { error: companyError } = await supabase.from('empresas').delete().eq('id', companyToDelete.id);
          if (companyError) {
            alert("Falha ao excluir empresa.");
          } else {
            fetchData();
          }
          setCompanyToDelete(null);
      }
  }

  const { total, active, inactive } = useMemo(() => {
    const total = companies.length;
    const active = companies.filter(c => c.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [companies]);
  
  const filteredCompanies = useMemo(() => {
    let tempCompanies = [...companies];

    if (statusFilter !== 'all') {
        tempCompanies = tempCompanies.filter(c => statusFilter === 'active' ? c.isActive : !c.isActive);
    }

    if (selectedCampaignId !== 'all') {
        const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
        if (selectedCampaign) {
            tempCompanies = tempCompanies.filter(company => selectedCampaign.companyIds.includes(company.id));
        } else {
            return [];
        }
    }
    
    return tempCompanies.sort((a, b) => a.name.localeCompare(b.name));
  }, [companies, campaigns, selectedCampaignId, statusFilter]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full w-full py-10">
            <LoadingSpinner text="Carregando empresas" />
        </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Empresas</h1>
        <div className="flex items-center gap-4 flex-wrap">
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="block w-full sm:w-auto px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-light-primary focus:border-light-primary text-sm"
            >
                <option value="all">Todos os Status</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
            </select>
            <select
                id="campaign-filter"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="block w-full sm:w-auto px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-light-primary focus:border-light-primary text-sm"
            >
                <option value="all">Filtrar por Campanha</option>
                {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                ))}
            </select>
            <button onClick={() => handleOpenModal(null)} className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">
                <PlusIcon className="h-5 w-5"/>
                <span className="hidden sm:inline">Adicionar Empresa</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total de Empresas" value={total} icon={BuildingOfficeIcon} color="bg-blue-500" />
        <StatCard title="Empresas Ativas" value={active} icon={UserCheckIcon} color="bg-success" />
        <StatCard title="Empresas Inativas" value={inactive} icon={UserXIcon} color="bg-error" />
      </div>

      <CompanyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCompany}
        company={editingCompany}
      />
      
      <Modal isOpen={!!companyToDelete} onClose={() => setCompanyToDelete(null)} title="Confirmar Exclusão">
          <p>Tem certeza que deseja excluir a empresa "<strong>{companyToDelete?.name}</strong>"? Todos os vouchers associados e o acesso de login também serão removidos.</p>
          <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setCompanyToDelete(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-error text-white rounded-lg hover:opacity-90">Excluir</button>
          </div>
      </Modal>

      <Modal isOpen={!!companyToToggle} onClose={() => setCompanyToToggle(null)} title="Confirmar Alteração de Status">
        {companyToToggle && (
            <div>
                <p>
                    Tem certeza que deseja{' '}
                    <strong className={companyToToggle.isActive ? 'text-error' : 'text-success'}>
                        {companyToToggle.isActive ? 'DESATIVAR' : 'ATIVAR'}
                    </strong>{' '}
                    a empresa "<strong>{companyToToggle.name}</strong>"?
                </p>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setCompanyToToggle(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                    <button onClick={confirmToggleActive} className={`px-4 py-2 text-white rounded-lg hover:opacity-90 ${companyToToggle.isActive ? 'bg-error' : 'bg-success'}`}>
                        {companyToToggle.isActive ? 'Sim, Desativar' : 'Sim, Ativar'}
                    </button>
                </div>
            </div>
        )}
      </Modal>
      
      <div className="space-y-6">
        {filteredCompanies.map(c => {
            const participatingCampaigns = campaigns.filter(campaign => campaign.companyIds.includes(c.id));
            const isExpanded = expandedCompanyId === c.id;
            return (
                <div key={c.id} className="bg-light-background dark:bg-dark-card rounded-lg shadow-md overflow-hidden transition-all duration-300">
                    <div 
                        className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-background/50"
                        onClick={() => handleToggleExpand(c.id)}
                        role="button"
                        aria-expanded={isExpanded}
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {c.logoUrl ? 
                                <img src={c.logoUrl} alt={`${c.name} logo`} className="h-12 w-12 rounded-full object-cover bg-gray-200 flex-shrink-0" /> :
                                <div className="h-12 w-12 rounded-full bg-light-primary/20 flex items-center justify-center text-light-primary flex-shrink-0">
                                <BuildingOfficeIcon className="h-6 w-6"/>
                                </div>
                            }
                            <h3 className="text-xl font-bold text-light-primary truncate pr-2">{c.name}</h3>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                            <div className="flex flex-col items-end flex-shrink-0">
                                <ToggleSwitch checked={c.isActive} onChange={() => requestToggleActive(c)} />
                                <span className={`text-xs mt-1 ${c.isActive ? 'text-success' : 'text-gray-500'}`}>{c.isActive ? 'Ativa' : 'Inativa'}</span>
                            </div>
                            <ArrowDownIcon className={`h-6 w-6 text-gray-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                     <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-light-border dark:border-dark-border">
                            {/* Company Details Column */}
                            <div className="p-5 flex flex-col justify-between">
                                <div>
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    <p><strong className="font-medium text-gray-800 dark:text-gray-100">Contato:</strong> {c.contactPerson}</p>
                                    <p><strong className="font-medium text-gray-800 dark:text-gray-100">Email:</strong> {c.contactEmail}</p>
                                    {c.instagram && <p><strong className="font-medium text-gray-800 dark:text-gray-100">Instagram:</strong> <a href={`https://instagram.com/${c.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-light-primary hover:underline">{c.instagram}</a></p>}
                                    <div className="pt-2">
                                        <strong className="font-medium text-gray-800 dark:text-gray-100">Campanhas Associadas:</strong>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {participatingCampaigns.length > 0 ? (
                                                participatingCampaigns.map(pc => (
                                                    <span key={pc.id} className="flex items-center gap-1.5 text-xs bg-gray-200 dark:bg-dark-background text-gray-700 dark:text-gray-200 px-2 py-1 rounded-full">
                                                        <TagIcon className="h-3 w-3" />
                                                        {pc.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-500">Nenhuma</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 pt-2">Criada em: {new Date(c.creationDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <footer className="pt-4 mt-4 border-t border-light-border dark:border-dark-border flex justify-end items-center gap-2">
                                    <button onClick={() => handleOpenModal(c)} className="p-2 text-gray-500 hover:text-light-primary hover:bg-gray-200 dark:hover:bg-dark-border rounded-full transition-colors"><PencilIcon className="h-5 w-5"/></button>
                                    <button onClick={() => handleDelete(c)} className="p-2 text-gray-500 hover:text-error hover:bg-gray-200 dark:hover:bg-dark-border rounded-full transition-colors"><TrashIcon className="h-5 w-5"/></button>
                                </footer>
                            </div>
                            
                            {/* Voucher Manager Column */}
                            <div className="p-5 md:border-l border-light-border dark:border-dark-border">
                                <CompanyVoucherManager company={c} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default AdminCompaniesPage;