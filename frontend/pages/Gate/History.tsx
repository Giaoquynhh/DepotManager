import React from 'react';
import Header from '@components/Header';
import GateHistory from './components/GateHistory';

export default function GateHistoryPage() {
  return (
    <>
      <Header />
      <main className="container gate-page">
        <GateHistory />
      </main>
    </>
  );
}
