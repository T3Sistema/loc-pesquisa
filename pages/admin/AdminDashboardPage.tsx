// pages/admin/AdminDashboardPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BuildingOfficeIcon } from '../../components/icons/BuildingOfficeIcon';
import { DocumentTextIcon } from '../../components/icons/DocumentTextIcon';
import { TicketIcon } from '../../components/icons/TicketIcon';
import { UserGroupIcon } from '../../components/icons/UserGroupIcon';
import { getCompanies, getFullCampaigns, getVouchers, getResponses } from '../../services/api';
import type { Company, Campaign, Voucher, SurveyResponse } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => {
    return (
        <div className="bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center gap-6">
            <div className="bg-light-primary/20 text-light-primary p-4 rounded-full">
                <Icon className="h-8 w-8" />
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold">{value}</p>
            </div>
        </div>
    );
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1'];

const AdminDashboardPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeThemeIndex, setActiveThemeIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, campaignsData, vouchersData, responsesData] = await Promise.all([
          getCompanies(),
          getFullCampaigns(),
          getVouchers(),
          getResponses(),
        ]);
        setCompanies(companiesData);
        setCampaigns(campaignsData);
        setVouchers(vouchersData);
        setResponses(responsesData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const campaignPerformanceData = useMemo(() => {
    return campaigns.map(campaign => {
        const responsesCount = responses.filter(r => r.campaignId === campaign.id).length;
        return {
            name: campaign.name,
            respostas: responsesCount,
            meta: campaign.responseGoal,
        };
    }).sort((a, b) => b.respostas - a.respostas);
  }, [campaigns, responses]);
  
  const campaignThemeData = useMemo(() => {
    const themeCounts = campaigns.reduce((acc, campaign) => {
        acc[campaign.theme] = (acc[campaign.theme] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(themeCounts).map(([name, value]) => ({ name, value }));
  }, [campaigns]);

  const responsesOverTimeData = useMemo(() => {
    const dailyCounts = responses.reduce((acc, response) => {
        const date = response.timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a,b) => {
            const [dayA, monthA] = a.date.split('/');
            const [dayB, monthB] = b.date.split('/');
            return new Date(`2024-${monthA}-${dayA}`).getTime() - new Date(`2024-${monthB}-${dayB}`).getTime();
        });
  }, [responses]);

  const totalCampaignsByTheme = useMemo(() => campaignThemeData.reduce((sum, entry) => sum + entry.value, 0), [campaignThemeData]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveThemeIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveThemeIndex(null);
  }, []);

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-full w-full py-10">
              <LoadingSpinner text="Carregando dashboard" />
          </div>
      );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Empresas Ativas" value={companies.filter(c => c.isActive).length} icon={BuildingOfficeIcon} />
        <StatCard title="Campanhas Criadas" value={campaigns.length} icon={UserGroupIcon} />
        <StatCard title="Vouchers Gerados" value={vouchers.length} icon={TicketIcon} />
        <StatCard title="Respostas Coletadas" value={responses.length} icon={DocumentTextIcon} />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Campaign Performance */}
        <div className="bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex-shrink-0">Desempenho das Campanhas</h2>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignPerformanceData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} contentStyle={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
                        <Legend />
                        <Bar dataKey="respostas" fill="#3B82F6" name="Respostas" />
                        <Bar dataKey="meta" fill="#E5E7EB" name="Meta" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Response Volume Over Time */}
        <div className="bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex-shrink-0">Volume de Respostas por Dia</h2>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={responsesOverTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#10B981" name="Respostas" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        {/* Campaign Theme Distribution */}
        <div className="bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex-shrink-0">Distribuição de Campanhas por Tema</h2>
            <div className="flex-grow">
                {campaignThemeData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center h-full">
                        <div className="relative w-full h-[250px] md:h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={campaignThemeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        onMouseEnter={onPieEnter}
                                        onMouseLeave={onPieLeave}
                                    >
                                        {campaignThemeData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={COLORS[index % COLORS.length]}
                                                className="transition-opacity duration-200"
                                                style={{ opacity: activeThemeIndex === null || activeThemeIndex === index ? 1 : 0.3, outline: 'none' }}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    {activeThemeIndex !== null && campaignThemeData[activeThemeIndex] ? (
                                        <>
                                            <p className="text-2xl font-bold">
                                                {totalCampaignsByTheme > 0 
                                                    ? `${((campaignThemeData[activeThemeIndex].value / totalCampaignsByTheme) * 100).toFixed(0)}%`
                                                    : '0%'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{campaignThemeData[activeThemeIndex].name}</p>
                                            <p className="text-xs text-gray-400">
                                                ({campaignThemeData[activeThemeIndex].value} {campaignThemeData[activeThemeIndex].value > 1 ? 'campanhas' : 'campanha'})
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-3xl font-bold">{totalCampaignsByTheme}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <ul className="space-y-2">
                             {campaignThemeData.map((entry, index) => {
                                const percentage = totalCampaignsByTheme > 0 
                                    ? ((entry.value / totalCampaignsByTheme) * 100).toFixed(0) 
                                    : 0;
                                return (
                                    <li 
                                        key={`legend-${index}`}
                                        className="flex items-center text-sm p-2 rounded-md transition-colors cursor-pointer"
                                        onMouseEnter={() => onPieEnter(null, index)}
                                        onMouseLeave={onPieLeave}
                                        style={{ backgroundColor: activeThemeIndex === index ? 'var(--primary-color-light)' : 'transparent' }}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                            <span>{entry.name}</span>
                                        </div>
                                        <span className="font-semibold ml-auto pl-2 whitespace-nowrap">{percentage}% ({entry.value})</span>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Nenhuma campanha para exibir.
                    </div>
                )}
            </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex-shrink-0">Atividade Recente</h2>
            <div className="flex-grow overflow-y-auto pr-2">
                <ul className="space-y-4">
                    {responses.slice(-10).reverse().map(r => (
                        <li key={r.id} className="flex items-start gap-3">
                            <div className="bg-gray-100 dark:bg-dark-background rounded-full p-2 mt-1 flex-shrink-0">
                                <DocumentTextIcon className="h-4 w-4 text-light-primary" />
                            </div>
                            <div>
                                <p className="text-sm">
                                    <strong className="font-semibold">{r.userName}</strong> respondeu à campanha <strong className="font-semibold">{campaigns.find(c => c.id === r.campaignId)?.name || 'N/A'}</strong>.
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{r.timestamp.toLocaleString('pt-BR')}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;