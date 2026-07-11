import React from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { moduleRegistry, MODULE_STATUS } from '../moduleRegistry';
import { usePortalTranslation } from '../locales/portalTranslations';
import { ncCapaAccessService } from '../../nc-capa/services/NcCapaAccessService';

const PortalLandingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const { t } = usePortalTranslation();

  // Basic permission check - just for UI display
  const hasModuleAccess = (module) => {
    if (module.moduleId === 'nc-capa') {
      return ncCapaAccessService.hasPermission(currentUser, 'NC_CAPA_VIEW') || 
             ncCapaAccessService.hasPermission(currentUser, 'NC_CAPA_VIEW_ALL');
    }
    // For DCC, assume access if they are logged in for this prototype,
    // or you could check if they have any roles.
    return true; 
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t('hub', 'title')}</h1>
        <p className="text-lg text-zinc-600">{t('hub', 'subtitle')}</p>
        {currentUser && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-full text-sm font-medium text-zinc-700">
            <span>{currentUser.name}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
            <span>{currentUser.department}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {moduleRegistry.sort((a, b) => a.order - b.order).map((module) => {
          const Icon = module.icon;
          const isActive = module.status === MODULE_STATUS.ACTIVE;
          const hasAccess = hasModuleAccess(module);
          
          return (
            <div 
              key={module.moduleId}
              className={`
                relative p-6 rounded-2xl border transition-all duration-200 flex flex-col h-full
                ${isActive && hasAccess 
                  ? 'bg-white border-zinc-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer group' 
                  : 'bg-zinc-50 border-zinc-200 opacity-70 cursor-not-allowed'}
              `}
              onClick={() => {
                if (isActive && hasAccess) {
                  navigate(module.route);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${isActive && hasAccess ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-zinc-200 text-zinc-500'}`}>
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                
                {isActive ? (
                  hasAccess ? (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full">
                      {t('hub', 'open')}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 rounded-full">
                      Locked
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-600 rounded-full">
                    {t('hub', 'comingSoon')}
                  </span>
                )}
              </div>
              
              <h3 className={`text-lg font-bold mb-2 ${isActive && hasAccess ? 'text-zinc-900' : 'text-zinc-700'}`}>
                {module.name}
              </h3>
              
              <p className="text-sm text-zinc-500 flex-grow mb-6 leading-relaxed">
                {module.description}
              </p>
              
              <div className="mt-auto">
                <button 
                  className={`
                    w-full py-2.5 rounded-lg font-medium text-sm transition-colors
                    ${isActive && hasAccess 
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800' 
                      : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'}
                  `}
                  disabled={!isActive || !hasAccess}
                >
                  {isActive ? (hasAccess ? `Open ${module.name.split(' ')[0]}` : 'Access Denied') : t('hub', 'comingSoon')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortalLandingPage;
