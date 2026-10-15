import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { clearSession, normalizeGrade, readSession, saveSession, SESSION_EXPIRED_EVENT } from '../utils/session';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readSession(localStorage));
  const { user, grade: selectedGrade } = session;

  const logout = () => {
    clearSession(localStorage);
    setSession({ user: null, grade: null });
  };

  useEffect(() => {
    const handleSessionExpired = () => setSession({ user: null, grade: null });
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const authenticate = async (path, credentials, fallbackMessage) => {
    try {
      const response = await api.post(path, credentials);
      const { token, user: userData } = response.data;
      const grade = saveSession(localStorage, token, userData);
      setSession({ user: userData, grade });
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || fallbackMessage };
    }
  };

  const login = (email, password) => authenticate('/auth/login', { email, password }, 'Đăng nhập thất bại');
  const register = (email, password, username, fullName) => authenticate(
    '/auth/register', { email, password, username, fullName }, 'Đăng ký thất bại'
  );

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      const grade = normalizeGrade(userData.profile?.grade);
      if (grade) localStorage.setItem('selectedGrade', String(grade));
      setSession(previous => ({ user: userData, grade: grade ?? previous.grade }));
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Không thể lấy thông tin user' };
    }
  };

  const setGrade = (value) => {
    const grade = normalizeGrade(value);
    if (!grade) return;
    localStorage.setItem('selectedGrade', String(grade));
    setSession(previous => ({ ...previous, grade }));
  };

  return (
    <AuthContext.Provider value={{
      user, loading: false, isAuthenticated: Boolean(user), selectedGrade,
      login, register, logout, getCurrentUser, setGrade,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
