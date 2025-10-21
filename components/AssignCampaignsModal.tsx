// components/AssignCampaignsModal.tsx
import React, { useState, useEffect } from 'react';
import type { Researcher, Campaign } from '../types';
import { getFullCampaigns } from '../services/api';
import Modal from './Modal';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';

interface AssignCampaignsModalProps {
    isOpen: boolean;
    onClose: () => void;
    researcher: Researcher;
    onSave: (researcher: Researcher, assignedCampaignIds: string[]) => void;
}

const AssignCampaignsModal: React.FC<AssignCampaignsModalProps> = ({ isOpen, onClose, researcher, onSave }) => {
    const [assignedIds, setAssignedIds] = useState<string[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getFullCampaigns().then(campaigns => {
                setAllCampaigns(campaigns);
                const researcherCampaigns = campaigns
                    .filter(c => c.researcherIds?.includes(researcher.id))
                    .map(c => c.id);
                setAssignedIds(researcherCampaigns);
                setIsLoading(false);
            })
        }
    }, [isOpen, researcher]);
    
    const handleToggleCampaign = (campaignId: string) => {
        setAssignedIds(prev =>
            prev.includes(campaignId)
                ? prev.filter(id => id !== campaignId)
                : [...prev, campaignId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(researcher, assignedIds);
    };

    const filteredCampaigns = allCampaigns.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Vincular Campanhas a ${researcher.name}`}>
             <form onSubmit={handleSubmit}>
                <div className="relative mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar campanha..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full input-style pl-10"
                    />
                </div>
                {isLoading ? <p>Carregando campanhas...</p> : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 border border-light-border dark:border-dark-border rounded-md p-2">
                        {filteredCampaigns.map(campaign => (
                            <label key={campaign.id} className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${campaign.isActive ? 'bg-gray-50 dark:bg-dark-background hover:bg-gray-200 dark:hover:bg-dark-border' : 'bg-gray-200 dark:bg-dark-border text-gray-400'}`}>
                                <input
                                    type="checkbox"
                                    checked={assignedIds.includes(campaign.id)}
                                    onChange={() => handleToggleCampaign(campaign.id)}
                                    className="h-5 w-5 text-light-primary focus:ring-light-primary rounded"
                                    disabled={!campaign.isActive}
                                />
                                <span className={`ml-3 flex-grow ${!campaign.isActive ? 'line-through' : ''}`}>{campaign.name}</span>
                                {!campaign.isActive && <span className="text-xs font-semibold">INATIVA</span>}
                            </label>
                        ))}
                    </div>
                )}


                 <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-light-border dark:border-dark-border">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold rounded-lg hover:opacity-90">Salvar Vínculos</button>
                </div>
             </form>
        </Modal>
    );
};

export default AssignCampaignsModal;