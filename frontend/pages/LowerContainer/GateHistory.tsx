import React from 'react';
import Header from '@components/Header';
import LowerGateHistory from './components/LowerGateHistory';

export default function LowerGateHistoryPage() {
  return (
    <>
      <Header />
      <main className="container gate-page">
        <LowerGateHistory />
      </main>
    </>
  );
}
