import React from 'react';
import Header from '@components/Header';
import GateDashboard from '../Gate/components/GateDashboard';
import { useToast } from '../../hooks/useToastHook';

export default function LiftContainerGatePage() {
  const { ToastContainer } = useToast();

  return (
    <>
      <Header />
      <GateDashboard title="bảng điều khiển cổng-nâng container" />
      <ToastContainer />
    </>
  );
}



