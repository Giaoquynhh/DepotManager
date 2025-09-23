import React from 'react';
import Header from '@components/Header';
import LowerGateDashboard from './components/LowerGateDashboard';
import { useToast } from '../../hooks/useToastHook';

export default function LowerContainerGatePage() {
  const { ToastContainer } = useToast();

  return (
    <>
      <Header />
      <LowerGateDashboard />
      <ToastContainer />
    </>
  );
}


