
// pages/company/CompanyDashboardPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../../components/Header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getResponses, getFullCampaigns } from '../../services/api';
import type { SurveyResponse, Campaign } from '../../types';
import { QuestionType } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PrinterIcon } from '../../components/icons/PrinterIcon';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal';
import { CheckCircleIcon } from '../../components/icons/CheckCircleIcon';
import { DocumentArrowDownIcon } from '../../components/icons/DocumentArrowDownIcon';
import { DocumentTextIcon } from '../../components/icons/DocumentTextIcon';
import { UserGroupIcon } from '../../components/icons/UserGroupIcon';
import { StarIcon } from '../../components/icons/StarIcon';


const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => {
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

const CompanyDashboardPage: React.FC = () => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeAgeIndex, setActiveAgeIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [responsesData, campaignsData] = await Promise.all([
          getResponses(),
          getFullCampaigns(),
        ]);
        setResponses(responsesData);
        setCampaigns(campaignsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  const { satisfactionDistributionData, ageData, averageSatisfaction, companyCampaignsCount } = useMemo(() => {
    const satisfactionQuestionIdMap = new Map<string, string>();
    const companyCampaigns = campaigns.filter(c => user && c.companyIds.includes(user.profileId));
    
    companyCampaigns.forEach(campaign => {
        const satisfactionQuestion = campaign.questions.find(q => q.type === QuestionType.RATING);
        if (satisfactionQuestion) {
            satisfactionQuestionIdMap.set(campaign.id, satisfactionQuestion.id);
        }
    });

    const satisfactionCounts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let totalSatisfactionScore = 0;
    let satisfactionResponseCount = 0;

    responses.forEach(response => {
        const satisfactionQuestionId = satisfactionQuestionIdMap.get(response.campaignId);
        if (satisfactionQuestionId) {
            const answer = response.answers.find(a => a.questionId === satisfactionQuestionId)?.answer;
            const score = Number(answer);
            if (score >= 1 && score <= 5) {
                satisfactionCounts[score.toString()]++;
                totalSatisfactionScore += score;
                satisfactionResponseCount++;
            }
        }
    });

    const satisfactionDistributionData = Object.entries(satisfactionCounts).map(([score, count]) => ({
        score: `${score} ${parseInt(score, 10) > 1 ? 'Estrelas' : 'Estrela'}`,
        count,
    }));
    
    const averageSatisfaction = satisfactionResponseCount > 0 
        ? (totalSatisfactionScore / satisfactionResponseCount).toFixed(1) 
        : 'N/A';
    
    const ageRanges: Record<string, number> = { '0-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
    responses.forEach(response => {
        if (response.userAge) {
            const age = response.userAge;
            if (age <= 17) ageRanges['0-17']++;
            else if (age <= 24) ageRanges['18-24']++;
            else if (age <= 34) ageRanges['25-34']++;
            else if (age <= 44) ageRanges['35-44']++;
            else if (age <= 54) ageRanges['45-54']++;
            else ageRanges['55+']++;
        }
    });
    const ageData = Object.entries(ageRanges).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);
    
    return { satisfactionDistributionData, ageData, averageSatisfaction, companyCampaignsCount: companyCampaigns.length };

  }, [responses, campaigns, user]);

  const totalAgeRespondents = useMemo(() => ageData.reduce((sum, entry) => sum + entry.value, 0), [ageData]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveAgeIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveAgeIndex(null);
  }, []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text(`Relatório - ${user?.name || 'Empresa'}`, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Gerado em: ${formattedDate} às ${formattedTime}`, 14, 30);

    const tableHead = [['Nome', 'Idade', 'Telefone']];
    const tableBody = responses.map(r => [
        r.userName || 'N/A',
        r.userAge?.toString() || 'N/A',
        r.userPhone || 'N/A'
    ]);

    (doc as any).autoTable({
        head: tableHead,
        body: tableBody,
        startY: 40,
        headStyles: { fillColor: [59, 130, 246] },
        theme: 'grid',
    });

    doc.save('dados_respondentes.pdf');
  };
  
  const exportToCSV = () => {
    const headers = '"Nome","Idade","Telefone"';
    const csvRows = responses.map(r => {
        const name = `"${(r.userName || '').replace(/"/g, '""')}"`;
        const age = r.userAge || 'N/A';
        const phone = `"${(r.userPhone || '').replace(/"/g, '""')}"`;
        return [name, age, phone].join(',');
    });
    
    const csvString = [headers, ...csvRows].join('\n');
    
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "dados_respondentes.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmExport = () => {
    exportToPDF();
    setIsPdfModalOpen(false);
    setToastMessage('PDF exportado com sucesso!');
    setShowSuccessToast(true);
    setTimeout(() => {
        setShowSuccessToast(false);
    }, 3000);
  };
  
  const handleConfirmCsvExport = () => {
    exportToCSV();
    setIsCsvModalOpen(false);
    setToastMessage('CSV exportado com sucesso!');
    setShowSuccessToast(true);
    setTimeout(() => {
        setShowSuccessToast(false);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text">
        <Header title="Dashboard da Empresa" />
        <main className="p-4 sm:p-8 max-w-7xl mx-auto flex flex-grow items-center justify-center">
            <LoadingSpinner text="Carregando dados" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text">
      <Header title="Dashboard da Empresa" />
      <main className="p-4 sm:p-8 max-w-screen-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Análise de Respostas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total de Respostas" value={responses.length} icon={DocumentTextIcon} />
            <StatCard title="Campanhas Participantes" value={companyCampaignsCount} icon={UserGroupIcon} />
            <StatCard title="Média de Satisfação" value={averageSatisfaction} icon={StarIcon} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">Faixa Etária dos Respondentes</h3>
                 {ageData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="relative w-full h-[250px] md:h-auto">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={ageData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        onMouseEnter={onPieEnter}
                                        onMouseLeave={onPieLeave}
                                    >
                                        {ageData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={COLORS[index % COLORS.length]}
                                                className="transition-opacity duration-200"
                                                style={{ opacity: activeAgeIndex === null || activeAgeIndex === index ? 1 : 0.3, outline: 'none' }}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    {activeAgeIndex !== null && ageData[activeAgeIndex] ? (
                                        <>
                                            <p className="text-2xl font-bold">
                                                {totalAgeRespondents > 0 
                                                    ? `${((ageData[activeAgeIndex].value / totalAgeRespondents) * 100).toFixed(0)}%`
                                                    : '0%'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{ageData[activeAgeIndex].name}</p>
                                            <p className="text-xs text-gray-400">
                                                ({ageData[activeAgeIndex].value} {ageData[activeAgeIndex].value > 1 ? 'respondentes' : 'respondente'})
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-3xl font-bold">{totalAgeRespondents}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <ul className="space-y-2">
                             {ageData.map((entry, index) => {
                                const percentage = totalAgeRespondents > 0 
                                    ? ((entry.value / totalAgeRespondents) * 100).toFixed(0) 
                                    : 0;
                                return (
                                    <li 
                                        key={`legend-${index}`}
                                        className="flex items-center text-sm p-2 rounded-md transition-colors cursor-pointer"
                                        onMouseEnter={() => onPieEnter(null, index)}
                                        onMouseLeave={onPieLeave}
                                        style={{ backgroundColor: activeAgeIndex === index ? 'var(--primary-color-light)' : 'transparent' }}
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
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                        Nenhum dado de faixa etária para exibir.
                    </div>
                )}
            </div>
             <div className="lg:col-span-3 bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">Distribuição de Satisfação</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={satisfactionDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="score" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
                        <Legend />
                        <Bar dataKey="count" fill="#10B981" name="Nº de Respostas" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="mt-8 bg-light-background dark:bg-dark-card p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h3 className="text-xl font-bold">Dados dos Respondentes (Total: {responses.length})</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        <PrinterIcon className="h-5 w-5" />
                        Exportar PDF
                    </button>
                    <button
                        onClick={() => setIsCsvModalOpen(true)}
                        className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        Exportar CSV
                    </button>
                </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-light-background dark:bg-dark-card">
                        <tr className="border-b border-light-border dark:border-dark-border">
                            <th className="p-3 font-semibold">Nome</th>
                            <th className="p-3 font-semibold">Idade</th>
                            <th className="p-3 font-semibold">Telefone</th>
                            <th className="p-3 font-semibold no-print-col">Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {responses.map(response => (
                             <tr key={response.id} className="border-b border-light-border dark:border-dark-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-dark-background/30">
                                <td className="p-3">{response.userName}</td>
                                <td className="p-3">{response.userAge || 'N/A'}</td>
                                <td className="p-3">{response.userPhone || 'N/A'}</td>
                                <td className="p-3 no-print-col">{response.timestamp.toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </main>

      <Modal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} title="Confirmar Exportação">
        <p>Deseja realmente exportar os dados dos respondentes para PDF?</p>
        <div className="flex justify-end gap-4 mt-6">
            <button onClick={() => setIsPdfModalOpen(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
            <button onClick={handleConfirmExport} className="px-4 py-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold rounded-lg hover:opacity-90">Confirmar e Baixar</button>
        </div>
      </Modal>
      
      <Modal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} title="Confirmar Exportação">
        <p>Deseja realmente exportar os dados dos respondentes para CSV?</p>
        <div className="flex justify-end gap-4 mt-6">
            <button onClick={() => setIsCsvModalOpen(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
            <button onClick={handleConfirmCsvExport} className="px-4 py-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold rounded-lg hover:opacity-90">Confirmar e Baixar</button>
        </div>
      </Modal>

    {showSuccessToast && (
      <div className="fixed bottom-8 right-8 z-50 bg-success text-white py-3 px-6 rounded-lg shadow-2xl flex items-center gap-3 transition-opacity duration-300">
        <CheckCircleIcon className="h-6 w-6" />
        <p className="font-semibold">{toastMessage}</p>
      </div>
    )}
    </div>
  );
};

export default CompanyDashboardPage;
