import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Setup() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to ShippingLines as default
    router.replace('/Setup/ShippingLines');
  }, [router]);

  return null; // This component only redirects
}