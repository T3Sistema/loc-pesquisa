import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { getFullCampaigns, getResponses } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Campaign, SurveyResponse } from '../../types';
import { MagnifyingGlassIcon } from '../../components/icons/MagnifyingGlassIcon';
import { TagIcon } from '../../components/icons/TagIcon';
import LoadingSpinner from '../../components/LoadingSpinner';
import LocationTracker from '../../components/LocationTracker';

const UserHomePage: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const [allCampaigns, allResponses] = await Promise.all([
          getFullCampaigns(),
          getResponses(),
        ]);
        setCampaigns(allCampaigns);
        setResponses(allResponses);
      } catch (error) {
        console.error("Failed to fetch campaigns or responses", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const getResponseCount = (campaignId: string) => {
    return responses.filter(r => r.campaignId === campaignId).length;
  };

  const availableCampaigns = useMemo(() => {
    if (!user) {
      return [];
    }
    return campaigns
      .filter(campaign => 
        campaign.isActive && 
        campaign.researcherIds?.includes(user.profileId) &&
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [user, campaigns, searchQuery]);
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text">
      <LocationTracker />
      <Header title="Painel do Pesquisador" />
      <main className="p-4 sm:p-8 max-w-7xl mx-auto">
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-3xl font-bold">Minhas Campanhas Disponíveis</h2>
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Buscar campanha..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 bg-light-background dark:bg-dark-card py-2 pr-3 pl-10 border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-light-primary"
                />
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-10">
                <LoadingSpinner text="Carregando campanhas" />
            </div>
          ) : availableCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCampaigns.map((campaign) => {
                const responseCount = getResponseCount(campaign.id);
                const isGoalMet = campaign.responseGoal > 0 && responseCount >= campaign.responseGoal;
                const progressPercentage = campaign.responseGoal > 0 ? Math.min((responseCount / campaign.responseGoal) * 100, 100) : 0;

                return (
                  <div key={campaign.id} className="bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-light-primary">{campaign.name}</h3>
                        <span className="flex-shrink-0 ml-2 text-xs bg-gray-200 dark:bg-dark-background text-gray-700 dark:text-gray-200 px-2 py-1 rounded-full flex items-center gap-1.5">
                            <TagIcon className="h-3 w-3" />
                            {campaign.theme}
                        </span>
                    </div>

                    <p className="mb-4 text-gray-600 dark:text-gray-400 flex-grow">{campaign.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          <span>Progresso</span>
                          <span>{responseCount} / {campaign.responseGoal}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                              className={`h-2.5 rounded-full transition-all duration-500 ${isGoalMet ? 'bg-success' : 'bg-gradient-to-r from-gradient-cyan to-gradient-blue'}`} 
                              style={{ width: `${progressPercentage}%` }}
                          ></div>
                      </div>
                    </div>

                    <Link
                      to={`/user/survey/${campaign.id}`}
                      className={`inline-block w-full text-center font-bold py-2 px-4 rounded-lg transition-opacity ${
                        isGoalMet
                          ? 'bg-success text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white hover:opacity-90'
                      }`}
                      onClick={(e) => isGoalMet && e.preventDefault()}
                      aria-disabled={isGoalMet}
                    >
                      {isGoalMet ? 'Meta Atingida' : 'Iniciar Pesquisa'}
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-light-background dark:bg-dark-card rounded-lg shadow-md">
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'Nenhuma campanha encontrada com esse nome.' : 'Nenhuma campanha foi atribuída a você no momento.'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    {searchQuery ? 'Tente buscar por outro termo.' : 'Por favor, entre em contato com um administrador.'}
                </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default UserHomePage;