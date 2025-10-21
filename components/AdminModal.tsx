// components/AdminModal.tsx
import React, { useState, useEffect } from 'react';
import type { Admin } from '../types';
import Modal from './Modal';
import { UploadIcon } from './icons/UploadIcon';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (admin: Admin) => void;
    admin: Admin | null;
}

const emptyAdmin: Omit<Admin, 'id' | 'isActive'> = {
    name: '',
    email: '',
    phone: '',
    dob: '',
    photoUrl: '',
};

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSave, admin }) => {
    const [formData, setFormData] = useState<Partial<Admin>>(admin || emptyAdmin);

    useEffect(() => {
        setFormData(admin || emptyAdmin);
    }, [admin, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const adminToSave: Admin = {
            id: admin?.id || `adm_${Date.now()}`,
            isActive: admin?.isActive ?? true,
            ...emptyAdmin,
            ...formData,
        };
        onSave(adminToSave);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={admin ? 'Editar Administrador' : 'Adicionar Novo Administrador'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-4">
                    <img
                        src={formData.photoUrl || 'https://aisfizoyfpcisykarrnt.supabase.co/storage/v1/object/public/prospectaifeedback/Screenshot%202025-08-25%20182827.png'}
                        alt="Foto do administrador"
                        className="h-20 w-20 rounded-full object-cover bg-gray-200 flex-shrink-0"
                    />
                    <div className="flex-grow">
                        <label htmlFor="photo-upload" className="block text-sm font-medium mb-1">Foto de Perfil</label>
                        <label
                            htmlFor="photo-upload-input"
                            className="flex-grow cursor-pointer flex items-center gap-2 justify-center px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-background"
                        >
                            <UploadIcon className="h-5 w-5"/>
                            <span>Mudar foto</span>
                        </label>
                        <input id="photo-upload-input" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </div>
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Nome Completo</label>
                    <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="w-full input-style" required />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">E-mail (para login)</label>
                    <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full input-style" required />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">Telefone</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full input-style" />
                </div>
                <div>
                    <label htmlFor="dob" className="block text-sm font-medium mb-1">Data de Nascimento</label>
                    <input type="date" id="dob" name="dob" value={formData.dob || ''} onChange={handleChange} className="w-full input-style" />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:opacity-90">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-gradient-to-r from-gradient-cyan to-gradient-blue text-white font-bold rounded-lg hover:opacity-90">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AdminModal;