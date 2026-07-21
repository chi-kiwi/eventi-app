import React from 'react';
import { Compass, MessageSquare, Briefcase, User, Calendar } from 'lucide-react';
import { useLanguage } from '../services/i18n.jsx';

export default function NavBar({ currentTab, onTabChange, userRole }) {
  const { t } = useLanguage();
  const showDashboard = userRole === 'organizzatore' || userRole === 'collaboratore';

  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${currentTab === 'explore' ? 'active' : ''}`}
        onClick={() => onTabChange('explore')}
      >
        <Compass className="nav-icon" />
        <span>{t('explore')}</span>
      </button>

      <button 
        className={`nav-item ${currentTab === 'calendar' ? 'active' : ''}`}
        onClick={() => onTabChange('calendar')}
      >
        <Calendar className="nav-icon" />
        <span>{t('calendar')}</span>
      </button>

      <button 
        className={`nav-item ${currentTab === 'chats' ? 'active' : ''}`}
        onClick={() => onTabChange('chats')}
      >
        <MessageSquare className="nav-icon" />
        <span>{t('chats')}</span>
      </button>

      {showDashboard && (
        <button 
          className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <Briefcase className="nav-icon" />
          <span>{t('dashboard')}</span>
        </button>
      )}

      <button 
        className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
        onClick={() => onTabChange('profile')}
      >
        <User className="nav-icon" />
        <span>{t('profile')}</span>
      </button>
    </nav>
  );
}
