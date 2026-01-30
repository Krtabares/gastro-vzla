'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('root' | 'admin' | 'cashier' | 'waiter')[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('gastro_user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    try {
      const user: User = JSON.parse(userStr);
      if (allowedRoles.includes(user.role)) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        // Redirigir al dashboard si no está autorizado
        router.push('/');
      }
    } catch (error) {
      router.push('/login');
    }
  }, [allowedRoles, router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
