// types.ts

export enum UserRole {
  USER = 'user',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export interface User {
  id: string; // id do perfil (admin, researcher, company)
  email: string;
  role: UserRole;
  name: string;
  photoUrl?: string;
  profileId: string; // id do perfil
}

export interface Admin {
    id: string;
    name: string;
    email: string;
    phone: string;
    dob: string; // ISO string for date YYYY-MM-DD
    photoUrl?: string;
    isActive: boolean;
}

export enum QuestionType {
    TEXT = 'text',
    MULTIPLE_CHOICE = 'multiple_choice',
    CHECKBOX = 'checkbox',
    RATING = 'rating',
    IMAGE_CHOICE = 'image_choice',
}

export interface QuestionOption {
  value: string;
  jumpTo?: string | null; // null/undefined for next, ID for jump, 'END_SURVEY' for finish
}

export interface Question {
    id: string;
    text: string;
    type: QuestionType;
    options?: QuestionOption[];
}

export interface Campaign {
    id:string;
    name: string;
    description: string;
    theme: string;
    isActive: boolean;
    startDate?: string; // ISO string for date
    endDate?: string; // ISO string for date
    startTime?: string; // HH:mm format
    endTime?: string; // HH:mm format
    questions: Question[];
    lgpdText: string;
    companyIds: string[];
    researcherIds?: string[];
    collectUserInfo: boolean;
    responseGoal: number;
    finalRedirectUrl?: string;
}

export interface Company {
    id: string;
    name: string;
    logoUrl?: string;
    cnpj: string;
    contactEmail: string;
    contactPhone: string;
    contactPerson: string;
    instagram?: string;
    creationDate: string; // ISO string for datetime
    isActive: boolean;
}

export enum Gender {
    MALE = 'Masculino',
    FEMALE = 'Feminino',
    OTHER = 'Outro',
    PREFER_NOT_TO_SAY = 'Prefiro não dizer',
}

export interface Researcher {
    id: string;
    name: string;
    email: string;
    phone: string;
    gender: Gender;
    dob: string; // ISO string for date YYYY-MM-DD
    photoUrl?: string;
    isActive: boolean;
    color?: string;
}

export interface Voucher {
    id: string;
    companyId: string;
    title: string;
    description: string;
    qrCodeValue: string;
    isActive: boolean;
    logoUrl?: string;
    totalQuantity: number;
    usedCount: number;
}

export interface SurveyResponse {
    id: string;
    campaignId: string;
    researcherId?: string; // ID of the researcher who collected the response
    userName: string;
    userPhone: string;
    userAge?: number;
    timestamp: Date;
    answers: {
        questionId: string;
        answer: any;
    }[];
}

export interface ResearcherLocation {
  id: string;
  researcherId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}