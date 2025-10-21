// components/CompanyVoucherManager.tsx
import React, { useState, useMemo, useEffect } from 'react';
import type { Voucher, Company } from '../types';
import { getVouchers } from '../services/api';
import { supabase } from '../services/supabase';
import Modal from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TicketIcon } from './icons/TicketIcon';
import { UploadIcon } from './icons/UploadIcon';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors focus:outline-none ${
        checked ? 'bg-dark-secondary' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${ checked ? 'translate-x-5' : 'translate-x-1' }`} />
    </button>
);

const emptyVoucher: Omit<Voucher, 'id' | 'companyId' | 'isActive' | 'usedCount'> = {
    title: '',
    description: '',
    qrCodeValue: '',
    logoUrl: '',
    totalQuantity: 0,
};

const VoucherModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (voucher: Partial<Voucher>) => void;
    voucher: Voucher | null;
    companyId: string;
}> = ({ isOpen, onClose, onSave, voucher, companyId }) => {
    const [formData, setFormData] = useState<Partial<Voucher>>(voucher || emptyVoucher);

    React.useEffect(() => {
        setFormData(voucher || emptyVoucher);
    }, [voucher, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    };
    
     const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const voucherToSave: Partial<Voucher> = {
            companyId: companyId,
            isActive: voucher?.isActive ?? true,
            usedCount: voucher?.usedCount ?? 0,
            title: formData.title || '',
            description: formData.description || '',
            qrCodeValue: formData.qrCodeValue || '',
            totalQuantity: formData.totalQuantity || 0,
            logoUrl: formData.logoUrl,
        };
        if(voucher?.id) {
            (voucherToSave as Voucher).id = voucher.id;
        }
        onSave(voucherToSave);
    }

    return (
         <Modal isOpen={isOpen} onClose={onClose} title={voucher ? 'Editar Voucher' : 'Novo Voucher'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Título</label>
                    <input name="title" value={formData.title} onChange={handleChange} className="w-full input-style" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Descrição</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full input-style" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Código (para QR Code)</label>
                    <input name="qrCodeValue" value={formData.qrCodeValue} onChange={handleChange} className="w-full input-style" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Quantidade Disponível</label>
                    <input type="number" name="totalQuantity" value={formData.totalQuantity} onChange={handleChange} className="w-full input-style" required min="0" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Logo da Empresa</label>
                    <div className="flex items-center gap-4 mt-2">
                        {formData.logoUrl && <img src={formData.logoUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover bg-gray-200 flex-shrink-0" />}
                         <label htmlFor="logo-upload-voucher" className="flex-grow cursor-pointer flex items-center gap-2 justify-center px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-background">
                           <UploadIcon className="h-5 w-5"/>
                           <span>Upload de arquivo</span>
                        </label>
                        <input id="logo-upload-voucher" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold rounded-lg hover:opacity-90">Salvar</button>
                </div>
            </form>
        </Modal>
    );
}

export const CompanyVoucherManager: React.FC<{ company: Company }> = ({ company }) => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);
    const [voucherToToggle, setVoucherToToggle] = useState<Voucher | null>(null);

    const updateVoucherList = async () => {
        setIsLoading(true);
        const allVouchers = await getVouchers();
        setVouchers(allVouchers.filter(v => v.companyId === company.id));
        setIsLoading(false);
    };

    useEffect(() => {
        updateVoucherList();
    }, [company.id]);
    
    const { activeVouchersCount, totalAvailableQuantity } = useMemo(() => {
        const activeVouchers = vouchers.filter(v => v.isActive);
        return {
            activeVouchersCount: activeVouchers.length,
            totalAvailableQuantity: activeVouchers.reduce((sum, v) => sum + (v.totalQuantity - v.usedCount), 0),
        };
    }, [vouchers]);

    const handleOpenModal = (voucher: Voucher | null) => {
        setEditingVoucher(voucher);
        setIsModalOpen(true);
    };
    
    const handleSaveVoucher = async (voucher: Partial<Voucher>) => {
        const voucherData = {
            id_empresa: voucher.companyId,
            titulo: voucher.title,
            descricao: voucher.description,
            valor_qrcode: voucher.qrCodeValue,
            esta_ativo: voucher.isActive,
            url_logo: voucher.logoUrl,
            quantidade_total: voucher.totalQuantity,
            quantidade_usada: voucher.usedCount,
        };

        if ('id' in voucher) {
            const { error } = await supabase.from('vouchers').update(voucherData).eq('id', voucher.id);
            if (error) alert('Falha ao atualizar voucher.');
        } else {
            const { error } = await supabase.from('vouchers').insert(voucherData);
            if (error) alert('Falha ao criar voucher.');
        }

        updateVoucherList();
        setIsModalOpen(false);
        setEditingVoucher(null);
    }
    
    const handleDeleteVoucher = async (voucherId: string) => {
        const { error } = await supabase.from('vouchers').delete().eq('id', voucherId);
        if (error) {
            alert('Falha ao excluir voucher.');
        } else {
            updateVoucherList();
        }
        setVoucherToDelete(null);
    }
    
    const requestToggleActive = (voucher: Voucher) => {
        setVoucherToToggle(voucher);
    };

    const confirmToggleActive = async () => {
        if (voucherToToggle) {
            const { error } = await supabase.from('vouchers').update({ esta_ativo: !voucherToToggle.isActive }).eq('id', voucherToToggle.id);
            if (error) {
                alert('Falha ao atualizar status do voucher.');
            } else {
                updateVoucherList();
            }
            setVoucherToToggle(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold">Vouchers</h4>
                <button onClick={() => handleOpenModal(null)} className="flex items-center gap-1.5 bg-dark-secondary text-white text-sm font-bold py-1.5 px-3 rounded-md hover:opacity-90">
                    <PlusIcon className="h-4 w-4"/>
                    <span>Adicionar</span>
                </button>
            </div>
            
            <VoucherModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveVoucher}
                voucher={editingVoucher}
                companyId={company.id}
            />

            <Modal isOpen={!!voucherToDelete} onClose={() => setVoucherToDelete(null)} title="Excluir Voucher">
                <p>Tem certeza que deseja excluir o voucher "<strong>{voucherToDelete?.title}</strong>"?</p>
                 <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setVoucherToDelete(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                    <button onClick={() => handleDeleteVoucher(voucherToDelete!.id)} className="px-4 py-2 bg-error text-white rounded-lg hover:opacity-90">Excluir</button>
                </div>
            </Modal>

            <Modal isOpen={!!voucherToToggle} onClose={() => setVoucherToToggle(null)} title="Confirmar Alteração de Status">
                {voucherToToggle && (
                    <div>
                        <p>
                            Tem certeza que deseja{' '}
                            <strong className={voucherToToggle.isActive ? 'text-error' : 'text-success'}>
                                {voucherToToggle.isActive ? 'DESATIVAR' : 'ATIVAR'}
                            </strong>{' '}
                            o voucher "<strong>{voucherToToggle.title}</strong>"?
                        </p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setVoucherToToggle(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                            <button onClick={confirmToggleActive} className={`px-4 py-2 text-white rounded-lg hover:opacity-90 ${voucherToToggle.isActive ? 'bg-error' : 'bg-success'}`}>
                                {voucherToToggle.isActive ? 'Sim, Desativar' : 'Sim, Ativar'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            
            <div className="mb-4 p-3 bg-gray-100 dark:bg-dark-background rounded-lg flex justify-around text-center">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vouchers Ativos</p>
                    <p className="font-bold text-lg text-light-text dark:text-dark-text">{activeVouchersCount}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Disponível</p>
                    <p className="font-bold text-lg text-light-text dark:text-dark-text">{totalAvailableQuantity}</p>
                </div>
            </div>

            <div className="space-y-3 max-h-52 overflow-y-auto pr-2">
                {isLoading ? <p>Carregando vouchers...</p> : vouchers.length > 0 ? vouchers.map(v => (
                    <div key={v.id} className="p-3 bg-gray-50 dark:bg-dark-background/50 rounded-md flex justify-between items-start">
                        <div className="flex items-start gap-3">
                             {v.logoUrl ? 
                                <img src={v.logoUrl} alt={v.title} className="h-10 w-10 rounded-lg object-cover bg-gray-200 flex-shrink-0" /> : 
                                <TicketIcon className="h-6 w-6 text-light-primary flex-shrink-0 mt-1" />
                            }
                            <div className="flex-grow">
                                <p className="font-semibold text-sm leading-tight">{v.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{v.description}</p>
                                <div className="flex items-center gap-x-4 flex-wrap">
                                    <p className="text-xs font-mono text-dark-secondary mt-1">{v.usedCount} / {v.totalQuantity} usados</p>
                                    {company.instagram && <p className="text-xs text-gray-400 mt-1">{company.instagram}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <ToggleSwitch checked={v.isActive} onChange={() => requestToggleActive(v)} />
                            <button onClick={() => handleOpenModal(v)} className="p-1 text-gray-500 hover:text-light-primary"><PencilIcon className="h-4 w-4"/></button>
                            <button onClick={() => setVoucherToDelete(v)} className="p-1 text-gray-500 hover:text-error"><TrashIcon className="h-4 w-4"/></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">Nenhum voucher cadastrado.</p>
                )}
            </div>
        </div>
    );
};