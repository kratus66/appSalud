'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-30">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
          </button>

          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-medical-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.firstName[0]}{user?.lastName[0]}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
