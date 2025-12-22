import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedGrade = localStorage.getItem('selectedGrade');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Lấy grade từ user profile hoặc localStorage
        const grade = userData.profile?.grade || (savedGrade ? parseInt(savedGrade) : null);
        if (grade) {
          setSelectedGrade(grade);
          localStorage.setItem('selectedGrade', grade.toString());
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedGrade');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, data: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng nhập thất bại',
      };
    }
  };

  // Register function
  const register = async (email, password, username, fullName) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        username,
        fullName,
      });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, data: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng ký thất bại',
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Get current user
  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Cập nhật selectedGrade nếu có trong profile
      if (userData.profile?.grade) {
        setSelectedGrade(userData.profile.grade);
        localStorage.setItem('selectedGrade', userData.profile.grade.toString());
      }
      
      return { success: true, data: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy thông tin user',
      };
    }
  };

  // Set selected grade
  const setGrade = (grade) => {
    setSelectedGrade(grade);
    localStorage.setItem('selectedGrade', grade.toString());
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    selectedGrade,
    login,
    register,
    logout,
    getCurrentUser,
    setGrade,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

