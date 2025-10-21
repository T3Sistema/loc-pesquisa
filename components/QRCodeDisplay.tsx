import React from 'react';
import type { Voucher, Company } from '../types';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { TicketIcon } from './icons/TicketIcon';


interface QRCodeDisplayProps {
  title: string;
  qrCodeValue: string;
  shareUrl: string;
  vouchers: Voucher[];
  companies: Company[];
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ title, qrCodeValue, shareUrl, vouchers, companies }) => {
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeValue)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Participe da pesquisa "${title}" e ganhe recompensas! Acesse: ${shareUrl}`)}`;

  return (
    <div className="text-center">
      <h3 className="text-lg font-bold mb-2 text-light-text dark:text-dark-text">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Aponte a câmera do seu celular para o QR Code abaixo para participar.</p>
      <div className="flex justify-center mb-4">
        <img src={qrCodeImageUrl} alt="QR Code" className="rounded-lg border-4 border-light-border dark:border-dark-border" />
      </div>
      <div className="mb-6">
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-light-primary hover:underline break-all">{shareUrl}</a>
      </div>
       <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
      >
        <WhatsappIcon className="h-5 w-5" />
        Compartilhar no WhatsApp
      </a>

      {vouchers.length > 0 && (
        <div className="mt-8 pt-4 border-t border-light-border dark:border-dark-border">
          <h4 className="font-bold mb-2 text-light-text dark:text-dark-text">Recompensas disponíveis:</h4>
          <ul className="text-left text-sm text-gray-600 dark:text-gray-300 space-y-2">
            {vouchers.map(v => {
                const company = companies.find(c => c.id === v.companyId);
                return (
                    <li key={v.id} className="flex items-center gap-3">
                         {v.logoUrl ? 
                            <img src={v.logoUrl} alt={v.title} className="h-8 w-8 rounded-full object-cover bg-gray-200" /> :
                            <div className="h-8 w-8 rounded-full bg-light-primary/20 flex items-center justify-center flex-shrink-0">
                                <TicketIcon className="h-4 w-4 text-light-primary"/>
                            </div>
                        }
                        <div>
                            <span>{v.title}</span>
                            {company?.instagram && <span className="text-xs ml-2 text-gray-400">({company.instagram})</span>}
                        </div>
                    </li>
                );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
