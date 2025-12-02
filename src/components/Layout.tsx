import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import user from '../assets/user.png';

// Navigation items structure remains the same
const navItems = [
  { key: '/', label: 'Home', to: '/' },
  { key: '/resources', label: 'Simulation Resources', to: '/resources' },
  { key: '/index', label: 'Index System', to: '/index' },
  { key: '/decision', label: 'Intelligent Decision-making', to: '/decision' },
  { key: '/about', label: 'About', to: '/about' },
];

// Helper function to create Breadcrumb items (similar logic as before)
interface BreadcrumbItem {
  title: string;
  isLast: boolean;
}

const getBreadcrumbItems = (pathname: string): BreadcrumbItem[] => {
  return pathname
    .split('/')
    .filter(Boolean)
    .map((path, index, array) => ({
      title: path.charAt(0).toUpperCase() + path.slice(1),
      isLast: index === array.length - 1,
    }));
};

export default function Layout() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine the current path for active link highlighting
  const currentPath = location.pathname;
  const showFooter = currentPath !== '/decision';

  // Tailwind classes for theme-dependent background and text color
  const themeBg = darkMode ? 'bg-black text-white' : 'bg-white text-gray-800';
  const headerBg = darkMode ? 'bg-black' : 'bg-white';
  const footerBg = darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600';
  const menuBg = darkMode ? 'bg-black' : 'bg-white';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeBg}`}>

      {/* Header area (Sticky with flex layout) */}
      <header className={`sticky top-0 z-50 ${headerBg} shadow`}>
        <nav className="mx-auto flex items-center justify-between p-3">

          {/* Logo */}
          <div className="shrink-0">
            <img src={logo} alt="logo" className="h-10" />
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-8">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className={`text-sm font-medium whitespace-nowrap ${currentPath === item.key
                  ? '!text-blue-500 border-b-2 border-blue-500 pb-1 font-semibold'
                  : darkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-black'
                  }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Dark mode switch */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="ml-4 flex items-center space-x-1"
            >
              <div
                className={`w-10 h-5 rounded-full flex items-center transition-colors duration-300 ${darkMode ? 'bg-blue-600' : 'bg-yellow-400'
                  }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow transform transition duration-300 ${darkMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                ></div>
              </div>
              <span>{darkMode ? '🌙' : '☀️'}</span>
            </button>

            {/* Avatar */}
            <img src={user} alt="avatar" className="w-8 h-8 rounded-full ml-3" />
          </div>
        </nav>

        {/* Mobile Drawer */}
        <div className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition ${mobileOpen ? 'block' : 'hidden'}`}
          onClick={() => setMobileOpen(false)}></div>

        <div className={`lg:hidden fixed top-0 left-0 h-full w-72 ${menuBg} z-50 shadow-lg transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 flex justify-between items-center">
            <img src={logo} alt="logo" className="h-10" />
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col justify-between h-[calc(100%-72px)]">
            <nav className="px-4 space-y-4 mt-4 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-2 text-base ${currentPath === item.key
                    ? '!text-blue-500 font-semibold'
                    : darkMode
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-700 hover:text-black'
                    }`}
                >
                  {item.label}
                </Link>
              ))}

            </nav>

            <div className="px-4 py-5 border-t border-gray-700/20">
              {/* Mobile dark mode switch */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center space-x-2 py-2"
              >
                <div className={`w-10 h-5 rounded-full flex items-center transition-colors ${darkMode ? 'bg-blue-600' : 'bg-yellow-400'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition ${darkMode ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
                <span className="text-base">{darkMode ? '🌙' : '☀️'}</span>
              </button>
              {/* Avatar */}
              <img src={user} className="w-10 h-10 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      {/* Content area */}
      <main>
        {/* Breadcrumb (simplified with Tailwind) */}
        {getBreadcrumbItems(currentPath).map((item, index) => (
          <li key={index} className="flex items-center">
            {!item.isLast && <span className="mx-2">/</span>}
          </li>
        ))}
        {/* Router area */}
          <Outlet context={{ darkMode }}/>
      </main>

      {/* Footer area */}
      {showFooter && (
        <footer className={`text-center py-4 text-sm ${footerBg}`}>
        &copy; {new Date().getFullYear()} Created by OpenGMS
      </footer>
      )}
    </div>
  );
}