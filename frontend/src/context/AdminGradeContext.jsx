import { createContext, useContext, useState, useEffect } from 'react';

const AdminGradeContext = createContext();

export const useAdminGrade = () => {
  const context = useContext(AdminGradeContext);
  if (!context) {
    throw new Error('useAdminGrade must be used within AdminGradeProvider');
  }
  return context;
};

export const AdminGradeProvider = ({ children }) => {
  const [selectedGrade, setSelectedGrade] = useState(() => {
    const saved = localStorage.getItem('adminSelectedGrade');
    return saved ? parseInt(saved) : 1;
  });

  useEffect(() => {
    localStorage.setItem('adminSelectedGrade', selectedGrade.toString());
  }, [selectedGrade]);

  const value = {
    selectedGrade,
    setSelectedGrade
  };

  return (
    <AdminGradeContext.Provider value={value}>
      {children}
    </AdminGradeContext.Provider>
  );
};
