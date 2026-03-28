import React from 'react';
import { Monitor, Smartphone, Settings, Tv } from 'lucide-react';

interface NavigationProps {
  currentPath: string;
}

export default function Navigation({ currentPath }: NavigationProps) {
  const links = [
    { path: '#/', label: 'Main', icon: Monitor },
    { path: '#/remote', label: 'Remote', icon: Smartphone },
    { path: '#/ads-admin', label: 'Admin', icon: Settings },
    { path: './mmr-ads.html', label: 'Ads', icon: Tv, isExternal: true },
  ];

  return (
    <nav className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = currentPath === link.path || (link.path === '#/' && currentPath === '#');
        
        return (
          <a
            key={link.path}
            href={link.path}
            target={link.isExternal ? '_blank' : '_self'}
            rel={link.isExternal ? 'noopener noreferrer' : ''}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
              isActive 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-red-600'
            }`}
          >
            <Icon size={18} />
            <span className="hidden sm:inline">{link.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
