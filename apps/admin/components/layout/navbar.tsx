'use client';

import { useEffect, useState } from 'react';

export function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center px-6">
        <div className="ml-auto flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-900 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
