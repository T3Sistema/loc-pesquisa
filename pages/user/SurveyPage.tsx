import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getCampaignById, addSurveyResponse } from '../../services/api';
import type { Campaign, Question } from '../../types';
import { QuestionType } from '../../types';
import { CheckCircleIcon } from '../../components/icons/CheckCircleIcon';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';


const SurveyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasAgreedLgpd, setHasAgreedLgpd] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAge, setUserAge] = useState('');
  const [hasProvidedInfo, setHasProvidedInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [infoError, setInfoError] = useState('');

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) {
        navigate('/user/home');
        return;
      }
      try {
        setIsLoading(true);
        const foundCampaign = await getCampaignById(id);
        if (foundCampaign) {
          setCampaign(foundCampaign);
        } else {
          navigate('/user/home');
        }
      } catch (error) {
        console.error("Failed to fetch campaign", error);
        navigate('/user/home');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaign();
  }, [id, navigate]);

  const handleAnswerChange = (questionId: string, value: any, type: QuestionType) => {
    if (type === QuestionType.CHECKBOX) {
        const currentAnswers = answers[questionId] || [];
        const newAnswers = currentAnswers.includes(value)
            ? currentAnswers.filter((item: string) => item !== value)
            : [...currentAnswers, value];
        setAnswers((prev) => ({ ...prev, [questionId]: newAnswers }));
    } else {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (campaign && user) {
        try {
            const formattedAnswers = Object.keys(answers).map(questionId => ({
                questionId,
                answer: answers[questionId],
            }));

            await addSurveyResponse({
                campaignId: campaign.id,
                researcherId: user.profileId,
                userName: campaign.collectUserInfo ? userName : `Participante Anônimo`,
                userPhone: campaign.collectUserInfo ? userPhone : '',
                userAge: campaign.collectUserInfo && userAge ? parseInt(userAge, 10) : undefined,
                answers: formattedAnswers,
            });

            alert('Obrigado por responder!');
            navigate(`/rewards/${campaign.id}`);
        } catch (error) {
            console.error("Failed to submit response", error);
            alert("Houve um erro ao enviar sua resposta. Tente novamente.");
        }
    }
  };
  
  const handleNext = () => {
    if (!campaign) return;

    const currentQuestion = campaign.questions[currentQuestionIndex];
    const answer = answers[currentQuestion.id];
    let jumpToId: string | null | undefined = null;
    const isLastQuestion = currentQuestionIndex >= campaign.questions.length - 1;

    if ((currentQuestion.type === QuestionType.MULTIPLE_CHOICE || 
         currentQuestion.type === QuestionType.IMAGE_CHOICE ||
         currentQuestion.type === QuestionType.RATING) && answer) {
        
        const answerAsString = String(answer);
        const selectedOption = currentQuestion.options?.find(opt => opt.value === answerAsString);
        jumpToId = selectedOption?.jumpTo;

    } else if (currentQuestion.type === QuestionType.CHECKBOX && Array.isArray(answer) && answer.length > 0) {
        for (const option of currentQuestion.options || []) {
            if (answer.includes(option.value) && option.jumpTo) {
                jumpToId = option.jumpTo;
                break;
            }
        }
    }
    
    if (jumpToId) {
        if (jumpToId === 'END_SURVEY') {
            handleSubmit();
            return;
        }

        const nextQuestionIndex = campaign.questions.findIndex(q => q.id === jumpToId);
        if (nextQuestionIndex !== -1) {
            setCurrentQuestionIndex(nextQuestionIndex);
            return;
        }
    }
    
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // If it's the last question and there's no jump logic, submit.
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (isLoading || !campaign) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-dark-background flex items-center justify-center">
        <LoadingSpinner text="Carregando pesquisa" />
      </div>
    );
  }
  
  if (!hasAgreedLgpd) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text">
            <Header title="Termos da Pesquisa" />
            <main className="p-4 sm:p-8 max-w-3xl mx-auto">
                <div className="bg-light-background dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-lg">
                    <h1 className="text-2xl font-bold text-light-primary mb-4">Antes de começar...</h1>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">Por favor, leia e concorde com os termos de uso de dados para participar desta campanha.</p>
                    <div className="p-4 border border-light-border dark:border-dark-border rounded-md bg-gray-50 dark:bg-dark-background max-h-60 overflow-y-auto mb-6">
                        <h2 className="font-bold mb-2">Termos de Privacidade e Uso de Dados (LGPD)</h2>
                        <p className="text-sm whitespace-pre-wrap">{campaign.lgpdText}</p>
                    </div>
                    <button
                        onClick={() => setHasAgreedLgpd(true)}
                        className="w-full bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Concordo e quero participar
                    </button>
                </div>
            </main>
        </div>
    );
  }

  if (campaign.collectUserInfo && !hasProvidedInfo) {
    const ageRanges = [
        { label: '-18', value: '17' },
        { label: '18-24', value: '21' },
        { label: '25-44', value: '25' },
        { label: '45+', value: '45' },
    ];
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text">
            <Header title="Identificação" />
            <main className="p-4 sm:p-8 max-w-3xl mx-auto">
                <div className="bg-light-background dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-lg">
                    <h1 className="text-2xl font-bold text-light-primary mb-2">Identificação do Participante</h1>
                    <p className="mb-6 text-gray-600 dark:text-gray-400">Por favor, preencha seus dados para continuar.</p>
                    <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        if (!userAge) {
                            setInfoError('Por favor, selecione sua faixa etária.');
                            return;
                        }
                        setInfoError('');
                        setHasProvidedInfo(true); 
                    }}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium mb-1">Nome Completo</label>
                                <input
                                    id="userName"
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-dark-background border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Faixa Etária</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {ageRanges.map((range) => (
                                        <button
                                            key={range.label}
                                            type="button"
                                            onClick={() => {
                                                setUserAge(range.value);
                                                setInfoError('');
                                            }}
                                            className={`text-center p-3 rounded-lg border-2 transition-colors duration-200 ${
                                                userAge === range.value
                                                    ? 'bg-light-primary border-light-primary text-white font-bold'
                                                    : 'bg-white dark:bg-dark-background border-light-border dark:border-dark-border hover:border-light-primary/50'
                                            }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="userPhone" className="block text-sm font-medium mb-1">Telefone (WhatsApp)</label>
                                <input
                                    id="userPhone"
                                    type="tel"
                                    value={userPhone}
                                    onChange={(e) => setUserPhone(e.target.value)}
                                    placeholder="(99) 99999-9999"
                                    className="w-full px-3 py-2 bg-white dark:bg-dark-background border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-primary"
                                    required
                                />
                            </div>
                            {infoError && <p className="text-sm text-center text-error font-medium">{infoError}</p>}
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity mt-6">
                            Iniciar Pesquisa
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
  }

  const currentQuestion = campaign.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / campaign.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex >= campaign.questions.length - 1;

  const renderQuestion = (question: Question) => {

    switch (question.type) {
      case QuestionType.TEXT:
        return (
          <textarea
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
            className="mt-4 w-full p-3 bg-white dark:bg-dark-background border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-primary"
            rows={5}
            placeholder="Sua resposta..."
          />
        );
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <div className="mt-4 space-y-3">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center p-3 bg-gray-50 dark:bg-dark-background rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-border">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={(answers[question.id] || '') === option.value}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                  className="h-5 w-5 text-light-primary focus:ring-light-primary"
                />
                <span className="ml-3 text-lg">{option.value}</span>
              </label>
            ))}
          </div>
        );
      case QuestionType.CHECKBOX:
        return (
          <div className="mt-4 space-y-3">
            {question.options?.map((option) => (
              <label key={option.value} className="flex items-center p-3 bg-gray-50 dark:bg-dark-background rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-border">
                <input
                  type="checkbox"
                  name={question.id}
                  value={option.value}
                  checked={(answers[question.id] || []).includes(option.value)}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                  className="h-5 w-5 text-light-primary focus:ring-light-primary rounded"
                />
                <span className="ml-3 text-lg">{option.value}</span>
              </label>
            ))}
          </div>
        );
      case QuestionType.RATING:
        return (
          <div className="flex justify-center items-center gap-2 sm:gap-4 mt-6">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleAnswerChange(question.id, rating, question.type)}
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl font-bold transition-transform transform hover:scale-110 ${
                  (answers[question.id] || '') === rating
                    ? 'bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white scale-110'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        );
       case QuestionType.IMAGE_CHOICE:
        return (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {question.options?.map((option, index) => {
              const isSelected = (answers[question.id] || '') === option.value;
              return (
                <div
                  key={index}
                  onClick={() => handleAnswerChange(question.id, option.value, question.type)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all duration-200 ${
                    isSelected ? 'border-light-primary' : 'border-transparent'
                  }`}
                >
                  <img src={option.value} alt={`Opção ${index + 1}`} className="w-full h-auto object-cover aspect-square" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <CheckCircleIcon className="w-1/3 h-1/3 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-background text-light-text dark:text-dark-text">
      <Header title="Respondendo Pesquisa" />
      <main className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="bg-light-background dark:bg-dark-card p-6 sm:p-8 rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-light-primary">{campaign.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{campaign.description}</p>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
            <div className="bg-gradient-to-r from-gradient-cyan to-gradient-blue h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="min-h-[200px]">
              <h2 className="text-2xl font-semibold text-center">{currentQuestion.text}</h2>
              {renderQuestion(currentQuestion)}
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              <button
                type="button"
                onClick={handleNext}
                className={`${
                    isLastQuestion
                    ? 'bg-success'
                    : 'bg-gradient-to-r from-gradient-cyan to-gradient-blue'
                } text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity`}
              >
                {isLastQuestion ? 'Finalizar' : 'Próximo'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SurveyPage;