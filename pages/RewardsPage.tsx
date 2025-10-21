// pages/RewardsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import { getCampaignById, getVouchers, getCompanies, getResponses } from '../services/api';
import type { Voucher, Campaign, Company, SurveyResponse } from '../types';
import { TicketIcon } from '../components/icons/TicketIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import LoadingSpinner from '../components/LoadingSpinner';

const RewardsPage: React.FC = () => {
    const { campaignId } = useParams<{ campaignId: string }>();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
    const [allCompanies, setAllCompanies] = useState<Company[]>([]);
    const [allResponses, setAllResponses] = useState<SurveyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!campaignId) {
                setIsLoading(false);
                return;
            }
            try {
                const [campaignData, vouchersData, companiesData, responsesData] = await Promise.all([
                    getCampaignById(campaignId),
                    getVouchers(),
                    getCompanies(),
                    getResponses(),
                ]);

                setCampaign(campaignData);
                setAllCompanies(companiesData);
                setAllResponses(responsesData);

                if (campaignData) {
                    const activeCompanyIds = companiesData.filter(c => c.isActive).map(c => c.id);
                    const campaignActiveCompanies = campaignData.companyIds.filter(id => activeCompanyIds.includes(id));
                    const vouchers = vouchersData.filter(v => v.isActive && campaignActiveCompanies.includes(v.companyId));
                    setAvailableVouchers(vouchers);
                }
            } catch (error) {
                console.error("Failed to load rewards page data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [campaignId]);

    const responseCount = useMemo(() => {
        if (!campaignId) return 0;
        return allResponses.filter(r => r.campaignId === campaignId).length;
    }, [campaignId, allResponses]);

    const combinedQrCodeValue = useMemo(() => {
        if (availableVouchers.length === 0) return '';
        return availableVouchers.map(v => v.qrCodeValue).join(',');
    }, [availableVouchers]);

    const getQrCodeUrl = (value: string) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`;

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-dark-background flex items-center justify-center">
            <LoadingSpinner text="Carregando" />
        </div>
      );
    }
    
    if (!campaign) {
        return <div className="min-h-screen bg-gray-100 dark:bg-dark-background flex items-center justify-center">Campanha não encontrada.</div>;
    }
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text">
            <Header title={availableVouchers.length > 0 ? "Suas Recompensas" : "Pesquisa Concluída"} />
            <main className="p-4 sm:p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div className="text-center flex-grow">
                        <h1 className="text-3xl font-bold text-light-primary">Obrigado por participar!</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                           {availableVouchers.length > 0 
                             ? `Aqui estão suas recompensas pela campanha "${campaign.name}".`
                             : 'Sua resposta foi registrada com sucesso.'}
                        </p>
                    </div>
                     <div className="ml-4 flex-shrink-0 bg-light-background dark:bg-dark-card px-4 py-2 rounded-lg text-center shadow">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progresso</p>
                        <p className="text-2xl font-bold text-light-primary">{responseCount} / {campaign.responseGoal}</p>
                    </div>
                </div>
                
                <div className="printable-area mt-8 bg-light-background dark:bg-dark-card p-6 rounded-xl shadow-lg">
                    {availableVouchers.length > 0 || campaign.finalRedirectUrl ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            {/* QR Code Section */}
                            <div className={`text-center ${availableVouchers.length > 0 ? 'md:border-r border-light-border dark:border-dark-border md:pr-8' : 'md:col-span-2'}`}>
                                {campaign.finalRedirectUrl ? (
                                    <>
                                        <h2 className="text-2xl font-bold mb-2">Acesse o conteúdo exclusivo</h2>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">Aponte a câmera do seu celular para o QR Code abaixo para continuar.</p>
                                        <div className="flex justify-center">
                                            <img src={getQrCodeUrl(campaign.finalRedirectUrl)} alt="QR Code de Redirecionamento" className="rounded-lg border-4 border-light-border dark:border-dark-border" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold mb-2">Acesse o conteúdo exclusivo</h2>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">Aponte a câmera do seu celular para o QR Code abaixo para continuar.</p>
                                        <div className="flex justify-center">
                                            <img src={getQrCodeUrl(combinedQrCodeValue)} alt="Voucher QR Code" className="rounded-lg border-4 border-light-border dark:border-dark-border" />
                                        </div>
                                        <p className="text-xs mt-3 text-gray-500 dark:text-gray-400 font-mono break-all">{combinedQrCodeValue}</p>
                                    </>
                                )}
                            </div>

                            {/* Vouchers List Section */}
                            {availableVouchers.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Recompensas Inclusas:</h3>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {availableVouchers.map((voucher) => {
                                            const company = allCompanies.find(c => c.id === voucher.companyId);
                                            return (
                                                <div key={voucher.id} className="voucher-card-print bg-gray-50 dark:bg-dark-background rounded-lg p-4 flex items-start gap-4">
                                                    {voucher.logoUrl ? (
                                                        <img src={voucher.logoUrl} alt={company?.name} className="h-12 w-12 rounded-full object-cover bg-gray-200 flex-shrink-0"/>
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-light-primary/20 flex items-center justify-center flex-shrink-0">
                                                            <TicketIcon className="h-6 w-6 text-light-primary"/>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{company?.name || 'Empresa'}</p>
                                                        <h4 className="font-bold text-light-text dark:text-dark-text">{voucher.title}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">{voucher.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            <h2 className="text-xl font-bold">Agradecemos sua participação!</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Sua resposta foi registrada com sucesso.</p>
                        </div>
                    )}
                </div>

                 <div className="mt-10 text-center flex flex-col items-center gap-4">
                    <Link
                        to={`/user/survey/${campaignId}`}
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <PlusIcon className="h-6 w-6" /> 
                        Iniciar Nova Pesquisa
                    </Link>
                    <Link
                        to="/user/home"
                        className="font-medium text-light-primary dark:text-dark-primary hover:underline"
                    >
                        Voltar para Minhas Campanhas
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default RewardsPage;