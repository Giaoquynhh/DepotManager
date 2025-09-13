import React from 'react';
import Header from '@components/Header';
import GateDashboard from './components/GateDashboard';
import { useToast } from '../../hooks/useToastHook';

export default function GatePage() {
  const { ToastContainer } = useToast();
  
  return (
    <>
      <Header />
      <GateDashboard />
      <ToastContainer />
    </>
  );
}


