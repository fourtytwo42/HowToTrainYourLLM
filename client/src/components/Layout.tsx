import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { FiHome, FiList, FiSettings, FiPlay } from 'react-icons/fi';
import { BsSun, BsMoon } from 'react-icons/bs';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { name: 'Models', href: '/models', icon: FiList },
  { name: 'Training', href: '/training', icon: FiSettings },
  { name: 'Testing', href: '/testing', icon: FiPlay }
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Model Workshop
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle */}
          <div className="p-4 border-t dark:border-gray-700">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              {theme === 'light' ? (
                <>
                  <BsMoon className="w-5 h-5 mr-2" />
                  Dark Mode
                </>
              ) : (
                <>
                  <BsSun className="w-5 h-5 mr-2" />
                  Light Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
} 