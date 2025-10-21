import React from 'react';
import type { Question, QuestionOption } from '../types';
import { QuestionType } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { BranchIcon } from './icons/BranchIcon';


interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

const questionTypeLabels: Record<QuestionType, string> = {
    [QuestionType.TEXT]: 'Texto Aberto',
    [QuestionType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
    [QuestionType.CHECKBOX]: 'Múltipla Seleção',
    [QuestionType.RATING]: 'Avaliação (1-5)',
    [QuestionType.IMAGE_CHOICE]: 'Escolha de Imagem',
}

export const QuestionBuilder: React.FC<QuestionBuilderProps> = ({ questions, onChange }) => {

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type,
      ...( (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.CHECKBOX) && { options: [{ value: '', jumpTo: null }] }),
      ...( type === QuestionType.IMAGE_CHOICE && { options: [] }),
      ...( type === QuestionType.RATING && { options: [
            { value: '1', jumpTo: null },
            { value: '2', jumpTo: null },
            { value: '3', jumpTo: null },
            { value: '4', jumpTo: null },
            { value: '5', jumpTo: null },
        ]}),
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updatedQuestion };
    onChange(newQuestions);
  };
  
  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
    
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    onChange(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];
    if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.CHECKBOX) {
        question.options = [...(question.options || []), { value: '', jumpTo: null }];
        onChange(newQuestions);
    }
  };
  
  const updateOptionValue = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];
    if (question.options) {
        question.options[oIndex].value = value;
        onChange(newQuestions);
    }
  };

  const updateOptionJump = (qIndex: number, oIndex: number, jumpTo: string | null) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];
    if (question.options) {
        question.options[oIndex].jumpTo = jumpTo;
        onChange(newQuestions);
    }
  };
  
  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];
    if (question.options) {
        question.options = question.options.filter((_, i) => i !== oIndex);
        onChange(newQuestions);
    }
  };

  const handleImageUpload = (qIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        const newQuestions = [...questions];
        const question = newQuestions[qIndex];
        if(question.type === QuestionType.IMAGE_CHOICE) {
            question.options = [...(question.options || []), { value: base64String, jumpTo: null }];
            onChange(newQuestions);
        }
    };
    reader.readAsDataURL(file);
  };

  const renderJumpSelector = (q: Question, qIndex: number, opt: QuestionOption, oIndex: number, className: string = 'mt-2') => (
    <div className={`flex items-center gap-2 ${className}`}>
        <BranchIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <select
            value={opt.jumpTo || ''}
            onChange={(e) => updateOptionJump(qIndex, oIndex, e.target.value || null)}
            className="w-full text-xs px-2 py-1 bg-white dark:bg-dark-border border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-1 focus:ring-light-primary"
        >
            <option value="">Ir para: Próxima Pergunta</option>
            <option value="END_SURVEY">Ir para: Finalizar Pesquisa</option>
            {questions.filter(jq => jq.id !== q.id).map((jumpQ) => {
                const jumpQIndex = questions.findIndex(fq => fq.id === jumpQ.id);
                return (
                    <option key={jumpQ.id} value={jumpQ.id}>
                       Ir para: P{jumpQIndex + 1}: {jumpQ.text.substring(0, 40)}{jumpQ.text.length > 40 ? '...' : ''}
                    </option>
                )
            })}
        </select>
    </div>
  );

  return (
    <div className="space-y-4">
      {questions.map((q, qIndex) => (
        <div key={q.id} className="p-4 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background shadow-sm">
          <header className="flex justify-between items-center gap-2 mb-3 pb-2 border-b border-light-border dark:border-dark-border">
            <h4 className="font-bold text-sm text-light-text dark:text-dark-text">
                Pergunta {qIndex + 1}: <span className="font-normal text-light-primary">{questionTypeLabels[q.type]}</span>
            </h4>
            <div className="flex items-center gap-1">
                <button onClick={() => moveQuestion(qIndex, 'up')} disabled={qIndex === 0} className="p-1 text-gray-500 hover:text-light-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUpIcon className="h-4 w-4"/></button>
                <button onClick={() => moveQuestion(qIndex, 'down')} disabled={qIndex === questions.length - 1} className="p-1 text-gray-500 hover:text-light-primary disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDownIcon className="h-4 w-4"/></button>
                <button onClick={() => removeQuestion(qIndex)} className="p-1 text-gray-500 hover:text-error"><TrashIcon className="h-4 w-4" /></button>
            </div>
          </header>
          
          <div className="space-y-3">
             <textarea
                placeholder="Digite o texto da sua pergunta aqui..."
                value={q.text}
                onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md text-base"
                rows={2}
            />

            {(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.CHECKBOX) && (
                <div className="space-y-2 pt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Opções de Resposta</label>
                    {q.options?.map((opt, oIndex) => (
                        <div key={oIndex} className="bg-gray-50 dark:bg-dark-card/50 p-2 rounded-md">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder={`Opção ${oIndex + 1}`}
                                    value={opt.value}
                                    onChange={(e) => updateOptionValue(qIndex, oIndex, e.target.value)}
                                    className="w-full px-3 py-1 bg-white dark:bg-dark-border border border-light-border dark:border-dark-border rounded-md text-sm"
                                />
                                <button onClick={() => removeOption(qIndex, oIndex)} className="p-1 text-gray-400 hover:text-error" disabled={(q.options?.length || 0) <= 1}>
                                <XMarkIcon className="h-4 w-4"/>
                                </button>
                            </div>
                             {(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.CHECKBOX) && renderJumpSelector(q, qIndex, opt, oIndex)}
                        </div>
                    ))}
                    <button onClick={() => addOption(qIndex)} className="text-sm text-light-primary hover:underline flex items-center gap-1 mt-1">
                    <PlusIcon className="h-4 w-4"/> Adicionar Opção
                    </button>
                </div>
            )}
            
            {q.type === QuestionType.IMAGE_CHOICE && (
                <div className="space-y-2 pt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Opções de Imagem</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {q.options?.map((opt, oIndex) => (
                            <div key={oIndex}>
                                <div className="relative aspect-square">
                                    <img src={opt.value} alt={`Opção ${oIndex + 1}`} className="w-full h-full object-cover rounded-md bg-gray-200 dark:bg-gray-700" />
                                    <button onClick={() => removeOption(qIndex, oIndex)} className="absolute -top-1 -right-1 bg-error text-white rounded-full p-0.5 hover:opacity-90">
                                        <XMarkIcon className="h-3 w-3" />
                                    </button>
                                </div>
                                {renderJumpSelector(q, qIndex, opt, oIndex)}
                            </div>
                        ))}
                         <label className="flex items-center justify-center aspect-square border-2 border-dashed border-light-border dark:border-dark-border rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-background text-gray-400 dark:text-gray-500">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleImageUpload(qIndex, e.target.files[0])} />
                            <div className="text-center">
                                <PhotoIcon className="h-6 w-6 mx-auto"/>
                                <span className="text-xs mt-1 block">Adicionar</span>
                            </div>
                        </label>
                    </div>
                </div>
            )}
            
            {q.type === QuestionType.RATING && (
                 <div className="space-y-2 pt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Lógica Condicional por Nota</label>
                    {q.options?.map((opt, oIndex) => (
                        <div key={oIndex} className="bg-gray-50 dark:bg-dark-card/50 p-2 rounded-md flex items-center gap-4">
                            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Nota {opt.value}</span>
                            {renderJumpSelector(q, qIndex, opt, oIndex, 'flex-grow')}
                        </div>
                    ))}
                </div>
            )}
            {q.type === QuestionType.TEXT && ( <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">O usuário verá uma caixa de texto para resposta aberta.</p> )}
          </div>
        </div>
      ))}
      
      {questions.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-light-border dark:border-dark-border rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma pergunta adicionada.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Comece adicionando um tipo de pergunta abaixo.</p>
          </div>
      )}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-light-border dark:border-dark-border">
         <button onClick={() => addQuestion(QuestionType.TEXT)} className="text-sm px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            + Texto
         </button>
         <button onClick={() => addQuestion(QuestionType.MULTIPLE_CHOICE)} className="text-sm px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            + Múltipla Escolha
         </button>
         <button onClick={() => addQuestion(QuestionType.CHECKBOX)} className="text-sm px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            + Múltipla Seleção
         </button>
         <button onClick={() => addQuestion(QuestionType.RATING)} className="text-sm px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            + Avaliação (1-5)
         </button>
         <button onClick={() => addQuestion(QuestionType.IMAGE_CHOICE)} className="text-sm px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            + Imagem (Escolha Única)
         </button>
      </div>
    </div>
  );
};