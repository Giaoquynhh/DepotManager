import React from 'react';
import Header from '@components/Header';
import GateDashboard from '../Gate/components/GateDashboard';
import { useToast } from '../../hooks/useToastHook';
import { useRouteRefresh } from '../../hooks/useRouteRefresh';

export default function LiftContainerGatePage() {
  const { ToastContainer } = useToast();
  const refreshKey = useRouteRefresh();

  return (
    <>
      <Header />
      <GateDashboard 
        key={`lift-gate-dashboard-${refreshKey}`}
        title="bảng điều khiển cổng-nâng container" 
        lockedType="EXPORT" 
      />
      <ToastContainer />
    </>
  );
}



