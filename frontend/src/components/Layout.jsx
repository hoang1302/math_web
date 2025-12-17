import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, isAuthenticated, logout, selectedGrade } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-page bg-home">
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-sm shadow-md relative z-[100]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-3xl">🎓</span>
              <span className="text-2xl font-bold text-primary-700">
                MathVui
              </span>
            </Link>

            {/* Navigation - Chỉ giữ Trang chủ và Tiến độ */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Trang chủ
              </Link>
              <Link
                to="/progress"
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/progress')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tiến độ
              </Link>
              {isAuthenticated && user?.role !== 'admin' && (
                <Link
                  to="/select-grade"
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive('/select-grade')
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Chọn lớp
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="relative group" ref={menuRef}>
                    <button
                      className="flex items-center space-x-2 cursor-pointer focus:outline-none"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      aria-label="User menu"
                    >
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="hidden md:block text-gray-700 font-medium">
                        {user?.username || 'User'}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-500 hidden md:block transition-transform ${
                          isMenuOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {/* Dropdown Menu */}
                    <div
                      className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 transition-all z-[9999] ${
                        isMenuOpen
                          ? 'opacity-100 visible'
                          : 'opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to="/profile"
                        className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors rounded-t-lg ${
                          isActive('/profile') ? 'bg-primary-50 text-primary-700 font-medium' : ''
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        👤 Hồ sơ
                      </Link>
                      <Link
                        to="/settings"
                        className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors ${
                          isActive('/settings') ? 'bg-primary-50 text-primary-700 font-medium' : ''
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        ⚙️ Cài đặt
                      </Link>
                      <Link
                        to="/progress"
                        className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors ${
                          isActive('/progress') ? 'bg-primary-50 text-primary-700 font-medium' : ''
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        📊 Tiến độ
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 font-medium hover:text-primary-700 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Chỉ giữ Trang chủ và Tiến độ */}
        <div className="md:hidden border-t border-gray-200">
          <nav className="container mx-auto px-4 py-2 flex space-x-4 overflow-x-auto">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                isActive('/')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700'
              }`}
            >
              Trang chủ
            </Link>
            <Link
              to="/progress"
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                isActive('/progress')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700'
              }`}
            >
              Tiến độ
            </Link>
            {isAuthenticated && user?.role !== 'admin' && (
              <Link
                to="/select-grade"
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  isActive('/select-grade')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700'
                }`}
              >
                Chọn lớp
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-gray-400">Design by group 32</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
