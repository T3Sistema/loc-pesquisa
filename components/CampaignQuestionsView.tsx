// components/CampaignQuestionsView.tsx
import React from 'react';
import type { Question } from '../types';
import { QuestionType } from '../types';

const questionTypeLabels: Record<QuestionType, string> = {
    [QuestionType.TEXT]: 'Texto Aberto',
    [QuestionType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
    [QuestionType.CHECKBOX]: 'Múltipla Seleção',
    [QuestionType.RATING]: 'Avaliação (1-5)',
    [QuestionType.IMAGE_CHOICE]: 'Escolha de Imagem',
};

export const CampaignQuestionsView: React.FC<{ questions: Question[] }> = ({ questions }) => {
    if (!questions || questions.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Esta campanha ainda não possui perguntas.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <h4 className="text-md font-bold text-light-text dark:text-dark-text">Perguntas da Campanha</h4>
            {questions.map((q, index) => (
                <div key={q.id} className="p-3 border-l-4 border-light-primary bg-light-background dark:bg-dark-card rounded-r-md shadow-sm">
                    <p className="font-semibold">{index + 1}. {q.text}</p>
                    <p className="text-xs text-light-primary mb-2 ml-4">({questionTypeLabels[q.type]})</p>
                    
                    {(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.CHECKBOX) && (
                        <ul className="list-disc list-inside space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-300">
                            {q.options?.map((opt, oIndex) => <li key={oIndex}>{opt.value}</li>)}
                        </ul>
                    )}
                    
                    {q.type === QuestionType.IMAGE_CHOICE && (
                        <div className="pl-6 mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {q.options?.map((opt, oIndex) => (
                                <div key={oIndex} className="relative aspect-square">
                                    <img src={opt.value} alt={`Opção ${oIndex + 1}`} className="w-full h-full object-cover rounded-md bg-gray-200 dark:bg-dark-background" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};