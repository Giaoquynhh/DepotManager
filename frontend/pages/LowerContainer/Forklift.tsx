import React, { useMemo } from 'react';
import Header from '@components/Header';
import Forklift from '../Forklift';

export default function LowerForkliftPage() {
  // Reuse main Forklift page but logically this route is under LowerContainer
  // Filtering by IMPORT will be handled inside Forklift via query param we set here
  const query = useMemo(() => ({ type: 'IMPORT' }), []);
  return (
    <>
      <Header />
      <Forklift typeFilter={query.type as any} />
    </>
  );
}


