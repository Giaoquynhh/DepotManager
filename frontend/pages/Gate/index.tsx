import React from 'react';
import Header from '@components/Header';
import GateDashboard from './components/GateDashboard';
import { useToast } from '../../hooks/useToastHook';
import { useRouteRefresh } from '../../hooks/useRouteRefresh';

export default function GatePage() {
  const { ToastContainer } = useToast();
  const refreshKey = useRouteRefresh();
  
  return (
    <>
      <Header />
      <GateDashboard key={`gate-dashboard-${refreshKey}`} />
      <ToastContainer />
    </>
  );
}


