import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { FolderIcon } from './icons/FolderIcon';
import { MapPinIcon } from './icons/MapPinIcon';

const mainNavLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: ChartBarIcon },
  { name: 'Rastreamento', href: '/admin/tracking', icon: MapPinIcon },
  { name: 'Calendário', href: '/admin/calendar', icon: CalendarDaysIcon },
];

const managementNavLinks = [
  { name: 'Campanhas', href: '/admin/campaigns', icon: UserGroupIcon },
  { name: 'Empresas', href: '/admin/companies', icon: BuildingOfficeIcon },
  { name: 'Pesquisadores', href: '/admin/researchers', icon: IdentificationIcon },
  { name: 'Administradores', href: '/admin/administrators', icon: ShieldCheckIcon },
];

const userProfileLink = { name: 'Meu Perfil', href: '/admin/profile', icon: UserCircleIcon };

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    const [isManagementOpen, setIsManagementOpen] = useState(true);
    
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
            ? 'bg-light-primary/10 text-light-primary dark:bg-dark-primary/20'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`;

    const sidebarClasses = `
        w-64 bg-light-background dark:bg-dark-card p-4 border-r border-light-border dark:border-dark-border flex-col
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0 flex fixed inset-y-0 left-0 z-40' : '-translate-x-full hidden md:flex'}
    `;

  return (
    <aside className={sidebarClasses}>
      <nav className="flex flex-col gap-2 flex-grow">
        {mainNavLinks.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/admin/dashboard'}
            className={navLinkClasses}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
        
        {/* Management Collapsible Section */}
        <div>
          <button
            onClick={() => setIsManagementOpen(!isManagementOpen)}
            className="flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-3">
              <FolderIcon className="h-5 w-5" />
              <span>Gerenciamento</span>
            </div>
            <ArrowDownIcon className={`h-4 w-4 transition-transform duration-200 ${isManagementOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <div className={`mt-2 space-y-2 overflow-hidden transition-all duration-300 ${isManagementOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-4 flex flex-col gap-2">
              {managementNavLinks.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={navLinkClasses}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <div className="mt-auto">
        <NavLink
            to={userProfileLink.href}
            className={navLinkClasses}
          >
            <userProfileLink.icon className="h-5 w-5" />
            <span>{userProfileLink.name}</span>
          </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;