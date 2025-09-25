import React, { useMemo } from 'react';
import Header from '@components/Header';
import Forklift from '../Forklift';

export default function LiftForkliftPage() {
  const query = useMemo(() => ({ type: 'EXPORT' }), []);
  return (
    <>
      <Header />
      <Forklift typeFilter={query.type as any} />
    </>
  );
}


