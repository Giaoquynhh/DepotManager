import React, { useState } from 'react';
import Header from '@components/Header';
import GateHistory from './components/GateHistory';

export default function GateHistoryPage() {
  const [showHistory, setShowHistory] = useState(true);

  const handleBack = () => {
    window.location.href = '/Gate';
  };

  return (
    <>
      <Header />
      <main className="container gate-page">
        <div className="gate-history-wrapper">
          <GateHistory onBack={handleBack} />
        </div>
      </main>
    </>
  );
}


