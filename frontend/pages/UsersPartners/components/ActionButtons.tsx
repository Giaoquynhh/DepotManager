// Action Buttons component
import React from 'react';
import { User, UserAction, Language } from '../types';
import { canLockUnlockUsers, canDeleteUsers, canLockSpecificUser } from '@utils/rbac';

interface ActionButtonsProps {
  user: User;
  role: string;
  language: Language;
  translations: any;
  onUserAction: (id: string, action: UserAction) => void;
  isModal?: boolean;
  onModalUserAction?: (id: string, action: UserAction) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  user,
  role,
  language,
  translations,
  onUserAction,
  isModal = false,
  onModalUserAction
}) => {
  const handleAction = (action: UserAction) => {
    // Prevent disabling or locking SystemAdmin accounts
    if (user.role === 'SystemAdmin' && (action === 'disable' || action === 'lock')) {
      const message = language === 'vi' 
        ? 'Không thể vô hiệu hóa hoặc khóa tài khoản SystemAdmin' 
        : 'Cannot disable or lock SystemAdmin account';
      alert(message);
      return;
    }
    
    if (isModal && onModalUserAction) {
      onModalUserAction(user.id || user._id, action);
    } else {
      onUserAction(user.id || user._id, action);
    }
  };

  const isSystemAdmin = user.role === 'SystemAdmin';
  const isDisableAction = user.status === 'DISABLED' ? 'enable' : 'disable';
  const isLockAction = user.status === 'LOCKED' ? 'unlock' : 'lock';

  return (
    <td style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
      <button 
        className="btn btn-sm" 
        style={{
          background: user.status === 'DISABLED' ? '#059669' : '#dc2626',
          color: 'white',
          fontSize: '12px',
          padding: '4px 8px',
          opacity: isSystemAdmin && isDisableAction === 'disable' ? 0.5 : 1,
          cursor: isSystemAdmin && isDisableAction === 'disable' ? 'not-allowed' : 'pointer'
        }}
        title={
          isSystemAdmin && isDisableAction === 'disable' 
            ? (language === 'vi' ? 'Không thể vô hiệu hóa tài khoản SystemAdmin' : 'Cannot disable SystemAdmin account')
            : (user.status === 'DISABLED' ? translations[language].enableTooltip : translations[language].disableTooltip)
        } 
        onClick={() => handleAction(isDisableAction)}
        disabled={isSystemAdmin && isDisableAction === 'disable'}
      >
        {user.status === 'DISABLED' ? translations[language].enable : translations[language].disable}
      </button>
      
      {canLockUnlockUsers(role) && canLockSpecificUser(role, user.role) && (
        <button 
          className="btn btn-sm" 
          style={{
            background: user.status === 'LOCKED' ? '#059669' : '#d97706',
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px',
            opacity: isSystemAdmin && isLockAction === 'lock' ? 0.5 : 1,
            cursor: isSystemAdmin && isLockAction === 'lock' ? 'not-allowed' : 'pointer'
          }}
          title={
            isSystemAdmin && isLockAction === 'lock' 
              ? (language === 'vi' ? 'Không thể khóa tài khoản SystemAdmin' : 'Cannot lock SystemAdmin account')
              : (user.status === 'LOCKED' ? translations[language].unlockTooltip : translations[language].lockTooltip)
          } 
          onClick={() => handleAction(isLockAction)}
          disabled={isSystemAdmin && isLockAction === 'lock'}
        >
          {user.status === 'LOCKED' ? translations[language].unlock : translations[language].lock}
        </button>
      )}
      
      
      {user.status === 'DISABLED' && canDeleteUsers(role) && (
        <button 
          className="btn btn-sm" 
          style={{
            background: '#dc2626',
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px'
          }} 
          title={translations[language].deleteTooltip} 
          onClick={() => handleAction('delete')}
        >
          {translations[language].delete}
        </button>
      )}
    </td>
  );
};
