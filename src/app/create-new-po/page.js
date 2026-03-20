'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to the canonical PO creation page
export default function CreateNewPORedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/purchase-orders/new'); }, [router]);
  return null;
}
