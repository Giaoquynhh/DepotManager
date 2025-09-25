import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@components/Header';
import LowerGateDashboard from './components/LowerGateDashboard';
import { useToast } from '../../hooks/useToastHook';
import { useRouteRefresh } from '../../hooks/useRouteRefresh';

export default function LowerContainerGatePage() {
  const router = useRouter();
  const { ToastContainer } = useToast();
  const refreshKey = useRouteRefresh();
  const [forceRefresh, setForceRefresh] = useState(0);

  // Force refresh when coming from Request page
  useEffect(() => {
    if (router.isReady) {
      setForceRefresh(prev => prev + 1);
    }
  }, [router.pathname, router.isReady]);

  // Additional refresh when route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url === '/LowerContainer/Gate') {
        setForceRefresh(prev => prev + 1);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Header />
      <LowerGateDashboard key={`lower-gate-dashboard-${refreshKey}-${forceRefresh}`} />
      <ToastContainer />
    </>
  );
}


