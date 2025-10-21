// pages/admin/AdminCalendarPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getFullCampaigns, getResearchers } from '../../services/api';
import { supabase } from '../../services/supabase';
import type { Campaign, Researcher } from '../../types';
import CampaignScheduleModal from '../../components/CampaignScheduleModal';
import { CalendarEvent } from '../../components/CalendarEvent';
import LoadingSpinner from '../../components/LoadingSpinner';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

interface ModalState {
    isOpen: boolean;
    campaign?: Campaign | null;
    start?: Date;
    end?: Date;
}

const AdminCalendarPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false });

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [campaignsData, researchersData] = await Promise.all([getFullCampaigns(), getResearchers()]);
        setCampaigns(campaignsData);
        setResearchers(researchersData);
    } catch (e) {
        console.error(e);
        alert('Falha ao carregar dados do calendário.');
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const events = useMemo(() => {
    return campaigns
        .filter(c => c.startDate) // Apenas renderiza se tiver pelo menos uma data de início
        .map(campaign => {
            const endDateOrDefault = campaign.endDate || campaign.startDate!;
            const isAllDay = !campaign.startTime;
            
            const assignedResearchers = (campaign.researcherIds || [])
                .map(id => researchers.find(r => r.id === id))
                .filter((r): r is Researcher => Boolean(r));

            const resource = { ...campaign, assignedResearchers };

            if (isAllDay) {
                // Evento de dia inteiro
                const start = new Date(`${campaign.startDate!}T00:00:00`);
                const end = new Date(`${endDateOrDefault}T00:00:00`);
                // Para o react-big-calendar, a data de término de eventos de dia inteiro é exclusiva.
                // Um evento que termina no dia 22 deve ter a data de término como o início do dia 23.
                end.setDate(end.getDate() + 1); 
                
                return {
                    title: campaign.name,
                    start,
                    end,
                    allDay: true,
                    resource,
                };
            }

            // Evento com horário definido
            const start = new Date(`${campaign.startDate}T${campaign.startTime}`);
            let end;

            if (campaign.endTime) {
                end = new Date(`${endDateOrDefault}T${campaign.endTime}`);
                
                // CORREÇÃO: Verifica se o evento ocorre no mesmo dia localmente, mas se estende
                // para o dia seguinte quando convertido para UTC.
                if (start.toDateString() === end.toDateString() && start.getUTCDate() !== end.getUTCDate()) {
                    // Se isso acontecer, ajusta o horário de término para o final do dia localmente (23:59:59).
                    // Isso corrige o bug de visualização no modo "Mês" sem afetar significativamente
                    // as outras visualizações.
                    end.setHours(23, 59, 59, 999);
                }
            } else {
                // Se não houver horário de término, define uma duração padrão de 2 horas para visualização.
                end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
            }

            return {
                title: campaign.name,
                start,
                end,
                allDay: false,
                resource,
            };
    });
  }, [campaigns, researchers]);

  const handleSelectEvent = (event: { resource: Campaign }) => {
    setModalState({ isOpen: true, campaign: event.resource });
  };
  
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setModalState({ isOpen: true, start: slotInfo.start, end: slotInfo.end });
  }

  const handleSaveSchedule = async (updatedCampaign: Campaign) => {
      // Se estamos editando um evento existente (modalState.campaign tem valor)
      if (modalState.campaign) {
        const campaignData = {
          data_inicio: updatedCampaign.startDate,
          data_fim: updatedCampaign.endDate,
          hora_inicio: updatedCampaign.startTime,
          hora_fim: updatedCampaign.endTime,
          esta_ativa: updatedCampaign.isActive,
        };
        const { error } = await supabase.from('campanhas').update(campaignData).eq('id', updatedCampaign.id);
        
        if(error) {
          alert("Falha ao atualizar agendamento.");
        } else {
            // Atualiza os vínculos
            await supabase.from('campanhas_pesquisadores').delete().eq('id_campanha', updatedCampaign.id);
            if(updatedCampaign.researcherIds && updatedCampaign.researcherIds.length > 0) {
                await supabase.from('campanhas_pesquisadores').insert(updatedCampaign.researcherIds.map(rid => ({id_campanha: updatedCampaign.id, id_pesquisador: rid})));
            }
            await supabase.from('campanhas_empresas').delete().eq('id_campanha', updatedCampaign.id);
            if(updatedCampaign.companyIds && updatedCampaign.companyIds.length > 0) {
                await supabase.from('campanhas_empresas').insert(updatedCampaign.companyIds.map(cid => ({id_campanha: updatedCampaign.id, id_empresa: cid})));
            }
        }
      } else {
        // Se estamos criando um novo evento (clonando uma campanha existente)
        const newEventName = `${updatedCampaign.name} (${format(new Date(updatedCampaign.startDate!), 'dd/MM')})`;
        
        const campaignDataToInsert = {
            nome: newEventName,
            descricao: updatedCampaign.description,
            tema: updatedCampaign.theme,
            texto_lgpd: updatedCampaign.lgpdText,
            esta_ativa: updatedCampaign.isActive,
            coletar_info_usuario: updatedCampaign.collectUserInfo,
            meta_respostas: updatedCampaign.responseGoal,
            data_inicio: updatedCampaign.startDate,
            data_fim: updatedCampaign.endDate,
            hora_inicio: updatedCampaign.startTime,
            hora_fim: updatedCampaign.endTime,
            url_redirecionamento_final: updatedCampaign.finalRedirectUrl,
        };

        const { data: newCampaign, error: insertError } = await supabase.from('campanhas').insert(campaignDataToInsert).select().single();

        if (insertError || !newCampaign) {
          alert('Falha ao criar novo agendamento.');
          console.error(insertError);
        } else {
          // Copia as perguntas e opções da campanha original
          const questionsToCopy = updatedCampaign.questions.map((q, index) => ({
              id_campanha: newCampaign.id,
              texto: q.text,
              tipo: q.type,
              ordem: index
          }));
          
          const { data: newQuestions } = await supabase.from('perguntas').insert(questionsToCopy).select();

          if (newQuestions) {
              const optionsToCopy = updatedCampaign.questions.flatMap((q, qIndex) => (q.options || []).map((opt, oIndex) => ({
                  id_pergunta: newQuestions[qIndex].id,
                  valor: opt.value,
                  ordem: oIndex,
                  pular_para_pergunta: null, // Lógica de pulo não é copiada para simplicidade
                  pular_para_final: opt.jumpTo === 'END_SURVEY'
              })));
              if(optionsToCopy.length > 0) {
                await supabase.from('opcoes_perguntas').insert(optionsToCopy);
              }
          }
          
          // Copia os vínculos
          if(updatedCampaign.researcherIds?.length) {
              await supabase.from('campanhas_pesquisadores').insert(updatedCampaign.researcherIds.map(rid => ({id_campanha: newCampaign.id, id_pesquisador: rid})));
          }
          if(updatedCampaign.companyIds?.length) {
              await supabase.from('campanhas_empresas').insert(updatedCampaign.companyIds.map(cid => ({id_campanha: newCampaign.id, id_empresa: cid})));
          }
        }
      }
      
      fetchData();
      setModalState({ isOpen: false });
  }
  
  const handleCloseModal = () => {
      setModalState({ isOpen: false });
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Calendário de Campanhas</h1>
       {isLoading ? (
            <div className="flex items-center justify-center h-full w-full py-10">
                <LoadingSpinner text="Carregando calendário" />
            </div>
       ) : (
        <div className="bg-light-background dark:bg-dark-card p-4 rounded-lg shadow-md h-[calc(100vh-12rem)]">
            <Calendar
            selectable
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            culture="pt-BR"
            messages={{
                next: "Próximo",
                previous: "Anterior",
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia",
                agenda: "Agenda",
                date: "Data",
                time: "Hora",
                event: "Evento",
            }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            components={{
                event: CalendarEvent,
            }}
            />
        </div>
      )}
      
      {modalState.isOpen && (
        <CampaignScheduleModal
            isOpen={modalState.isOpen}
            onClose={handleCloseModal}
            campaign={modalState.campaign}
            onSave={handleSaveSchedule}
            initialStartDate={modalState.start}
            initialEndDate={modalState.end}
        />
      )}
    </div>
  );
};

export default AdminCalendarPage;