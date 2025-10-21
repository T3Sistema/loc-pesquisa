// services/api.ts
import { supabase } from './supabase';
import type { Admin, Campaign, Company, Researcher, SurveyResponse, Voucher, Question, QuestionOption, User, ResearcherLocation } from '../types';
import { Gender, QuestionType, UserRole } from '../types';

// Mappers from DB (snake_case) to App (camelCase)
const mapAdminFromDb = (dbAdmin: any): Admin => ({
    id: dbAdmin.id,
    name: dbAdmin.nome,
    email: dbAdmin.email,
    phone: dbAdmin.telefone,
    dob: dbAdmin.data_nascimento,
    photoUrl: dbAdmin.url_foto,
    isActive: dbAdmin.esta_ativo,
});

const mapCompanyFromDb = (dbCompany: any): Company => ({
    id: dbCompany.id,
    name: dbCompany.nome,
    logoUrl: dbCompany.url_logo,
    cnpj: dbCompany.cnpj,
    contactEmail: dbCompany.email_contato,
    contactPhone: dbCompany.telefone_contato,
    contactPerson: dbCompany.pessoa_contato,
    instagram: dbCompany.instagram,
    creationDate: dbCompany.data_criacao,
    isActive: dbCompany.esta_ativa,
});

const mapResearcherFromDb = (dbResearcher: any): Researcher => ({
    id: dbResearcher.id,
    name: dbResearcher.nome,
    email: dbResearcher.email,
    phone: dbResearcher.telefone,
    gender: dbResearcher.genero as Gender,
    dob: dbResearcher.data_nascimento,
    photoUrl: dbResearcher.url_foto,
    isActive: dbResearcher.esta_ativo,
    color: dbResearcher.cor,
});

const mapVoucherFromDb = (dbVoucher: any): Voucher => ({
    id: dbVoucher.id,
    companyId: dbVoucher.id_empresa,
    title: dbVoucher.titulo,
    description: dbVoucher.descricao,
    qrCodeValue: dbVoucher.valor_qrcode,
    isActive: dbVoucher.esta_ativo,
    logoUrl: dbVoucher.url_logo,
    totalQuantity: dbVoucher.quantidade_total,
    usedCount: dbVoucher.quantidade_usada,
});

const mapQuestionOptionFromDb = (dbOption: any): QuestionOption => ({
    value: dbOption.valor,
    jumpTo: dbOption.pular_para_pergunta || (dbOption.pular_para_final ? 'END_SURVEY' : null),
});

const mapQuestionFromDb = (dbQuestion: any, options: any[]): Question => ({
    id: dbQuestion.id,
    text: dbQuestion.texto,
    type: dbQuestion.tipo as QuestionType,
    options: options.filter(o => o.id_pergunta === dbQuestion.id).sort((a,b) => a.ordem - b.ordem).map(mapQuestionOptionFromDb),
});

// FIX: The `questions` parameter was changed to `allQuestionsData` and `allOptionsData` to handle filtering within this function.
// This resolves a TypeScript error where the Question type did not have a campaignId for filtering.
const mapCampaignFromDb = (dbCampaign: any, allQuestionsData: any[], allOptionsData: any[], companies: any[], researchers: any[]): Campaign => {
    const campaignQuestions = allQuestionsData
        .filter(q => q.id_campanha === dbCampaign.id)
        .sort((a,b) => a.ordem - b.ordem)
        .map(q => mapQuestionFromDb(q, allOptionsData));
    
    return {
        id: dbCampaign.id,
        name: dbCampaign.nome,
        description: dbCampaign.descricao,
        theme: dbCampaign.tema,
        isActive: dbCampaign.esta_ativa,
        startDate: dbCampaign.data_inicio,
        endDate: dbCampaign.data_fim,
        startTime: dbCampaign.hora_inicio,
        endTime: dbCampaign.hora_fim,
        lgpdText: dbCampaign.texto_lgpd,
        collectUserInfo: dbCampaign.coletar_info_usuario,
        responseGoal: dbCampaign.meta_respostas,
        questions: campaignQuestions,
        companyIds: companies.filter(c => c.id_campanha === dbCampaign.id).map(c => c.id_empresa),
        researcherIds: researchers.filter(r => r.id_campanha === dbCampaign.id).map(r => r.id_pesquisador),
        finalRedirectUrl: dbCampaign.url_redirecionamento_final,
    };
};

const mapResponseFromDb = (dbResponse: any, answers: any[]): SurveyResponse => ({
    id: dbResponse.id,
    campaignId: dbResponse.id_campanha,
    researcherId: dbResponse.id_pesquisador,
    userName: dbResponse.nome_usuario,
    userPhone: dbResponse.telefone_usuario,
    userAge: dbResponse.idade_usuario,
    timestamp: new Date(dbResponse.data_envio),
    answers: answers.filter(a => a.id_resposta_pesquisa === dbResponse.id).map(a => ({
        questionId: a.id_pergunta,
        answer: a.valor,
    })),
});

const mapLocationFromDb = (dbLocation: any): ResearcherLocation => ({
    id: dbLocation.id,
    researcherId: dbLocation.id_pesquisador,
    latitude: dbLocation.latitude,
    longitude: dbLocation.longitude,
    timestamp: new Date(dbLocation.timestamp),
});


// Generic Fetch
async function fetchData(table: string) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw new Error(error.message);
    return data;
}

// API Functions
export const getAdmins = async (): Promise<Admin[]> => (await fetchData('administradores')).map(mapAdminFromDb);
export const getCompanies = async (): Promise<Company[]> => (await fetchData('empresas')).map(mapCompanyFromDb);
export const getResearchers = async (): Promise<Researcher[]> => (await fetchData('pesquisadores')).map(mapResearcherFromDb);
export const getVouchers = async (): Promise<Voucher[]> => (await fetchData('vouchers')).map(mapVoucherFromDb);

export const getResponses = async (): Promise<SurveyResponse[]> => {
    const [responsesData, answersData] = await Promise.all([
        fetchData('respostas_pesquisas'),
        fetchData('respostas'),
    ]);
    return responsesData.map(r => mapResponseFromDb(r, answersData));
}

export const getFullCampaigns = async (): Promise<Campaign[]> => {
    const [campaignsData, questionsData, optionsData, companiesData, researchersData] = await Promise.all([
        fetchData('campanhas'),
        fetchData('perguntas'),
        fetchData('opcoes_perguntas'),
        fetchData('campanhas_empresas'),
        fetchData('campanhas_pesquisadores'),
    ]);
    return campaignsData.map(c => mapCampaignFromDb(c, questionsData, optionsData, companiesData, researchersData));
}

export const getCampaignById = async (id: string): Promise<Campaign | null> => {
    const { data: campaignData, error: campaignError } = await supabase.from('campanhas').select('*').eq('id', id).single();
    if (campaignError || !campaignData) return null;

    const { data: questionsData, error: questionsError } = await supabase.from('perguntas').select('*').eq('id_campanha', id).order('ordem');
    if(questionsError) throw questionsError;

    const questionIds = questionsData.map(q => q.id);
    const { data: optionsData, error: optionsError } = await supabase.from('opcoes_perguntas').select('*').in('id_pergunta', questionIds);
    if(optionsError) throw optionsError;

    const { data: companiesData, error: companiesError } = await supabase.from('campanhas_empresas').select('*').eq('id_campanha', id);
    if(companiesError) throw companiesError;
    
    const { data: researchersData, error: researchersError } = await supabase.from('campanhas_pesquisadores').select('*').eq('id_campanha', id);
    if(researchersError) throw researchersError;

    return mapCampaignFromDb(campaignData, questionsData, optionsData, companiesData, researchersData);
}

// ... Add more API functions for saving, deleting, updating as needed ...
// For brevity in this example, we'll focus on reads. The mutations will be implemented in the components for now.
export const addSurveyResponse = async (response: Omit<SurveyResponse, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
        .from('respostas_pesquisas')
        .insert({
            id_campanha: response.campaignId,
            id_pesquisador: response.researcherId,
            nome_usuario: response.userName,
            telefone_usuario: response.userPhone,
            idade_usuario: response.userAge,
        })
        .select()
        .single();
    
    if (error) throw error;
    
    const answersToInsert = response.answers.map(answer => ({
        id_resposta_pesquisa: data.id,
        id_pergunta: answer.questionId,
        valor: answer.answer
    }));

    const { error: answersError } = await supabase.from('respostas').insert(answersToInsert);
    if (answersError) throw answersError;
};

// Location Tracking API
export const addLocationHistory = async (location: Omit<ResearcherLocation, 'id' | 'timestamp'>) => {
    const { error } = await supabase
        .from('localizacao_historico')
        .insert({
            id_pesquisador: location.researcherId,
            latitude: location.latitude,
            longitude: location.longitude,
        });
    if (error) {
        console.error("Error saving location:", error);
    }
};

export const getLocationsForDate = async (date: string): Promise<ResearcherLocation[]> => {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const { data, error } = await supabase
        .from('localizacao_historico')
        .select('*')
        .gte('timestamp', startOfDay)
        .lte('timestamp', endOfDay)
        .order('timestamp', { ascending: true });
        
    if (error) {
        console.error("Error fetching locations:", error);
        return [];
    }

    return data.map(mapLocationFromDb);
};