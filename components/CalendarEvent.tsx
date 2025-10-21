// components/CalendarEvent.tsx
import React from 'react';
import type { Campaign, Researcher } from '../types';

// Helper to get initials
const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Helper to determine text color based on background
const getTextColorForBg = (hexColor: string) => {
    if (!hexColor) return '#ffffff';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#333333' : '#ffffff';
};


export const CalendarEvent: React.FC<{ event: { resource: Campaign & { assignedResearchers: Researcher[] } } }> = ({ event }) => {
    const { resource: campaign } = event;
    const { assignedResearchers } = campaign;

    return (
        <div className="h-full flex flex-col justify-start p-1" style={{ color: getTextColorForBg(assignedResearchers[0]?.color || '#3B82F6') }}>
            <strong className="text-xs truncate font-semibold">{campaign.name}</strong>
            <div className="flex items-center gap-1 mt-auto pt-1 flex-wrap">
                {assignedResearchers.map(researcher => {
                    const textColor = getTextColorForBg(researcher.color || '#6B7280');
                    return (
                        <div
                            key={researcher.id}
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm"
                            style={{ backgroundColor: researcher.color || '#6B7280', color: textColor }}
                            title={researcher.name}
                        >
                            {getInitials(researcher.name)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
