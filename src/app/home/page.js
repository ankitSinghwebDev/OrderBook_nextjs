import { Suspense } from 'react';
import HomeContent from './HomeContent';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="page-spinner" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
