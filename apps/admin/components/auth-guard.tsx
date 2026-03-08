'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!token || !userStr) {
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/login');
      }
    } catch (error) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      router.push('/login');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
