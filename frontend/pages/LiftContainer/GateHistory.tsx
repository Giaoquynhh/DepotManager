import React from 'react';
import Header from '@components/Header';
import LiftGateHistory from './components/LiftGateHistory';

export default function LiftGateHistoryPage() {
  return (
    <>
      <Header />
      <main className="container gate-page">
        <LiftGateHistory />
      </main>
    </>
  );
}
