'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProgramacionPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/planificador');
  }, [router]);
  return null;
}
