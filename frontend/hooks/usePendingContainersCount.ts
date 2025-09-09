import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface PendingContainersCountHook {
  count: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const fetcher = async (url: string): Promise<number> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token không tồn tại');
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Lọc chỉ lấy container có loại IMPORT và trạng thái GATE_IN
  const importContainers = (data.data || []).filter((request: any) => {
    return request.type === 'IMPORT';
  });
  
  return importContainers.length;
};

export const usePendingContainersCount = (refreshInterval: number = 5000): PendingContainersCountHook => {
  const [error, setError] = useState<string | null>(null);
  
  const { data: count = 0, error: swrError, isLoading, mutate } = useSWR(
    '/backend/gate/requests/search?status=GATE_IN&limit=100',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onError: (err) => {
        console.error('Error fetching pending containers count:', err);
        setError(err.message);
      },
      onSuccess: () => {
        setError(null);
      }
    }
  );

  const refresh = () => {
    mutate();
  };

  return {
    count,
    isLoading,
    error: error || (swrError ? swrError.message : null),
    refresh
  };
};
