import LoadingDisplay from './LoadingDisplay';
import ErrorDisplay from './ErrorDisplay';
import PendingContainersTable from './PendingContainersTable';

interface PendingContainersModalContentProps {
  loading: boolean;
  error: string;
  requests: any[];
  checkResults: {[key: string]: 'PASS' | 'FAIL' | 'FAIL_WITH_OPTIONS' | 'UNREPAIRABLE' | 'REPAIRABLE' | null};
  onRetry: () => void;
  onClose: () => void;
  onCheckContainer: (requestId: string) => void;
  onCheckResult: (requestId: string, result: 'PASS' | 'FAIL') => void;
  onFailOption: (requestId: string, option: 'UNREPAIRABLE' | 'REPAIRABLE') => void;
}

export default function PendingContainersModalContent({
  loading,
  error,
  requests,
  checkResults,
  onRetry,
  onClose,
  onCheckContainer,
  onCheckResult,
  onFailOption
}: PendingContainersModalContentProps) {
  if (loading) {
    return <LoadingDisplay />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={onRetry} 
        onClose={onClose} 
      />
    );
  }

  // Kiểm tra nếu không có container IMPORT nào
  if (requests.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '500',
          marginBottom: '12px'
        }}>
          Không có container IMPORT nào đang chờ kiểm tra
        </div>
        <div style={{
          fontSize: '14px',
          color: '#9ca3af'
        }}>
          Tất cả container EXPORT sẽ không hiển thị trong danh sách này
        </div>
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#d1d5db'
        }}>
          Chỉ container IMPORT mới cần kiểm tra bảo trì
        </div>
      </div>
    );
  }

  return (
    <>
      <PendingContainersTable
        requests={requests}
        checkResults={checkResults}
        onCheckContainer={onCheckContainer}
        onCheckResult={onCheckResult}
        onFailOption={onFailOption}
      />
    </>
  );
}
