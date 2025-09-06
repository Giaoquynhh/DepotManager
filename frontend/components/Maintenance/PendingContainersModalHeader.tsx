import { useTranslation } from '@hooks/useTranslation';

interface PendingContainersModalHeaderProps {
  onClose: () => void;
  title?: string;
}

export default function PendingContainersModalHeader({ onClose, title }: PendingContainersModalHeaderProps) {
  const { t } = useTranslation();
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
        {title || t('pages.maintenance.repairs.pendingContainers.defaultTitle')}
      </h3>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#666'
        }}
      >
        ×
      </button>
    </div>
  );
}
