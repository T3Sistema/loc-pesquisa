// components/CampaignScheduleModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Campaign, Company, Researcher } from '../types';
import { getResearchers, getCompanies, getFullCampaigns } from '../services/api';
import { supabase } from '../services/supabase';
import Modal from './Modal';
import { ToggleSwitch } from './ToggleSwitch';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { UsersIcon } from './icons/UsersIcon';


interface CampaignScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSave: (campaign: Campaign) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

const CampaignScheduleModal: React.FC<CampaignScheduleModalProps> = ({ isOpen, onClose, campaign, onSave, initialStartDate, initialEndDate }) => {
  const [formData, setFormData] = useState<Partial<Campaign>>({});
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isStartTimeEnabled, setIsStartTimeEnabled] = useState(false);
  const [isEndTimeEnabled, setIsEndTimeEnabled] = useState(false);
  
  // State for search and company management
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [allResearchers, setAllResearchers] = useState<Researcher[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [researcherSearch, setResearcherSearch] = useState('');

  const formatToYYYYMMDD = (date: Date) => {
    return date.toISOString().split('T')[0];
  }

  const formatToHHMM = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  const availableCampaignsForScheduling = allCampaigns.filter(c => c.isActive);
  const activeCampaign = campaign || allCampaigns.find(c => c.id === selectedCampaignId);

  useEffect(() => {
    const fetchData = async () => {
        const [companiesData, researchersData, campaignsData] = await Promise.all([getCompanies(), getResearchers(), getFullCampaigns()]);
        setAllCompanies(companiesData);
        setAllResearchers(researchersData);
        setAllCampaigns(campaignsData);
    };
    if (isOpen) {
        fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (campaign) {
        setFormData(campaign);
        setSelectedCampaignId(campaign.id);
        setIsStartTimeEnabled(!!campaign.startTime);
        setIsEndTimeEnabled(!!campaign.endTime);
    } else {
        const startDate = initialStartDate ? formatToYYYYMMDD(initialStartDate) : '';
        let endDate = initialStartDate ? formatToYYYYMMDD(initialStartDate) : '';
        
        const isAllDaySelection = initialStartDate ? (initialStartDate.getHours() === 0 && initialStartDate.getMinutes() === 0) : true;
        
        setIsStartTimeEnabled(!isAllDaySelection);
        setIsEndTimeEnabled(!isAllDaySelection);

        let startTime = '';
        let endTime = '';

        if (!isAllDaySelection && initialStartDate) {
            startTime = formatToHHMM(initialStartDate);
            if (initialEndDate) {
                endDate = formatToYYYYMMDD(initialEndDate);
                if (formatToHHMM(initialEndDate) === '00:00' && initialEndDate > initialStartDate) {
                    endTime = '23:59';
                } else {
                    endTime = formatToHHMM(initialEndDate);
                }
            }
        } else if (initialEndDate && initialStartDate && initialEndDate > initialStartDate!) {
            const inclusiveEndDate = new Date(initialEndDate);
            inclusiveEndDate.setDate(inclusiveEndDate.getDate() - 1);
            endDate = formatToYYYYMMDD(inclusiveEndDate);
        }
        
        setFormData({
            startDate,
            endDate,
            startTime,
            endTime,
            companyIds: [],
            researcherIds: [],
            isActive: false,
        });
        setSelectedCampaignId('');
    }
    setCompanySearch('');
    setResearcherSearch('');
  }, [campaign, isOpen, initialStartDate, initialEndDate, allCampaigns]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStartTimeToggle = (enabled: boolean) => {
    setIsStartTimeEnabled(enabled);
    if (!enabled) {
      setFormData(prev => ({ ...prev, startTime: '' }));
      // Also disable and clear end time if start time is disabled
      setIsEndTimeEnabled(false);
      setFormData(prev => ({ ...prev, endTime: '' }));
    }
  };

  const handleEndTimeToggle = (enabled: boolean) => {
    setIsEndTimeEnabled(enabled);
    if (!enabled) {
      setFormData(prev => ({ ...prev, endTime: '' }));
    }
  };


  const handleCampaignSelection = (id: string) => {
    setSelectedCampaignId(id);
    const selectedCampaign = allCampaigns.find(c => c.id === id);
    if (selectedCampaign) {
      setFormData(prevFormData => {
        const newFormData = {
          ...selectedCampaign,
          startDate: prevFormData.startDate,
          endDate: prevFormData.endDate,
          startTime: prevFormData.startTime,
          endTime: prevFormData.endTime,
        };
        setIsStartTimeEnabled(!!newFormData.startTime);
        setIsEndTimeEnabled(!!newFormData.endTime);
        return newFormData;
      });
    }
  };

  const handleResearcherToggle = (researcherId: string) => {
    const currentIds = formData.researcherIds || [];
    const newIds = currentIds.includes(researcherId)
      ? currentIds.filter(id => id !== researcherId)
      : [...currentIds, researcherId];
    setFormData(prev => ({ ...prev, researcherIds: newIds }));
  };
  
  const handleCompanySelection = (companyId: string) => {
    const currentIds = formData.companyIds || [];
    const newIds = currentIds.includes(companyId)
      ? currentIds.filter(cid => cid !== companyId)
      : [...currentIds, companyId];
    setFormData({ ...formData, companyIds: newIds });
  };
  
  const handleToggleCompanyActive = async (companyId: string) => {
    const company = allCompanies.find(c => c.id === companyId);
    if (company) {
        const { error } = await supabase.from('empresas').update({ esta_ativa: !company.isActive }).eq('id', companyId);
        if (error) {
            alert('Falha ao atualizar status da empresa.');
        } else {
            setAllCompanies(prevCompanies => 
                prevCompanies.map(c => 
                    c.id === companyId ? { ...c, isActive: !c.isActive } : c
                )
            );
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCampaign) {
      const updatedCampaign = {
          ...activeCampaign,
          ...formData,
          startTime: isStartTimeEnabled ? formData.startTime : '',
          endTime: isEndTimeEnabled ? formData.endTime : '',
      }
      onSave(updatedCampaign as Campaign);
    }
  };
  
  const filteredCompanies = useMemo(() => {
    return allCompanies.filter(company => 
        company.name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [allCompanies, companySearch]);

  const filteredResearchers = useMemo(() => {
    return allResearchers.filter(researcher =>
        researcher.name.toLowerCase().includes(researcherSearch.toLowerCase())
    );
  }, [allResearchers, researcherSearch]);
  
  return (
    <>
        <Modal isOpen={isOpen} onClose={onClose} title={campaign ? 'Editar Agendamento' : 'Agendar Campanha'}>
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {campaign ? (
                <h3 className="text-xl font-bold text-light-primary">{campaign.name}</h3>
            ) : (
                <div>
                    <label htmlFor="campaign-select" className="block text-sm font-medium mb-1">Selecione uma Campanha</label>
                    <select 
                        id="campaign-select"
                        value={selectedCampaignId}
                        onChange={e => handleCampaignSelection(e.target.value)}
                        className="w-full input-style"
                        required
                    >
                        <option value="" disabled>
                           Escolha uma campanha para agendar...
                        </option>
                        {availableCampaignsForScheduling.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium mb-1">Data de Início</label>
                    <input type="date" id="startDate" name="startDate" value={formData.startDate || ''} onChange={handleDateChange} className="w-full input-style" />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium mb-1">Data de Fim</label>
                    <input type="date" id="endDate" name="endDate" value={formData.endDate || ''} onChange={handleDateChange} className="w-full input-style" />
                </div>
            </div>
            
            <div className="pt-2 space-y-3">
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="modal-start-time-toggle" 
                        checked={isStartTimeEnabled}
                        onChange={(e) => handleStartTimeToggle(e.target.checked)}
                        className="h-5 w-5 text-light-primary focus:ring-light-primary rounded"
                    />
                    <label htmlFor="modal-start-time-toggle" className="block text-sm font-medium select-none cursor-pointer">Definir Horário de Início</label>
                    <input type="time" name="startTime" value={formData.startTime || ''} onChange={handleDateChange} className="ml-auto w-full max-w-[120px] input-style" disabled={!isStartTimeEnabled} />
                </div>
                 <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="modal-end-time-toggle" 
                        checked={isEndTimeEnabled}
                        onChange={(e) => handleEndTimeToggle(e.target.checked)}
                        className="h-5 w-5 text-light-primary focus:ring-light-primary rounded"
                        disabled={!isStartTimeEnabled}
                    />
                    <label htmlFor="modal-end-time-toggle" className={`block text-sm font-medium select-none cursor-pointer ${!isStartTimeEnabled ? 'text-gray-400' : ''}`}>Definir Horário de Fim</label>
                    <input type="time" name="endTime" value={formData.endTime || ''} onChange={handleDateChange} className="ml-auto w-full max-w-[120px] input-style" disabled={!isEndTimeEnabled || !isStartTimeEnabled} />
                </div>
            </div>

            
            {activeCampaign && (
                <>
                <div>
                    <h4 className="text-md font-bold mb-2 flex items-center gap-2 text-light-text dark:text-dark-text">
                        <UserCircleIcon className="h-5 w-5" />
                        Pesquisadores Responsáveis
                    </h4>
                    <div className="relative mb-2">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input type="text" placeholder="Buscar pesquisador..." value={researcherSearch} onChange={(e) => setResearcherSearch(e.target.value)} className="w-full input-style pl-9 text-sm py-1.5" />
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-light-border dark:border-dark-border rounded-md">
                        {filteredResearchers.map(researcher => (
                            <label key={researcher.id} className="flex items-center p-2 bg-gray-50 dark:bg-dark-background rounded-md cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(formData.researcherIds || []).includes(researcher.id)}
                                    onChange={() => handleResearcherToggle(researcher.id)}
                                    className="h-4 w-4 text-light-primary focus:ring-light-primary rounded"
                                />
                                <span className="ml-3">{researcher.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h4 className="text-md font-bold mb-2 flex items-center gap-2 text-light-text dark:text-dark-text">
                        <UsersIcon className="h-5 w-5" />
                        Empresas Participantes
                    </h4>
                    <div className="relative mb-2">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input type="text" placeholder="Buscar empresa..." value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} className="w-full input-style pl-9 text-sm py-1.5" />
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-light-border dark:border-dark-border rounded-md">
                        {filteredCompanies.map((company: Company) => (
                        <div key={company.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-background rounded-md">
                            <label className="flex items-center cursor-pointer flex-grow">
                            <input
                                type="checkbox"
                                checked={(formData.companyIds || []).includes(company.id)}
                                onChange={() => handleCompanySelection(company.id)}
                                className="h-4 w-4 text-light-primary focus:ring-light-primary rounded"
                                disabled={!company.isActive}
                            />
                            <span className={`ml-3 ${!company.isActive ? 'text-gray-400 line-through' : ''}`}>{company.name}</span>
                            </label>
                            <ToggleSwitch
                                checked={company.isActive}
                                onChange={() => handleToggleCompanyActive(company.id)}
                            />
                        </div>
                    ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                    <ToggleSwitch
                        checked={formData.isActive ?? false}
                        onChange={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    />
                    <label className="text-sm font-medium">Ativar Campanha</label>
                </div>
                </>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t border-light-border dark:border-dark-border">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold rounded-lg hover:opacity-90" disabled={!activeCampaign}>Salvar Agendamento</button>
            </div>
        </form>
        </Modal>
    </>
  );
};

export default CampaignScheduleModal;