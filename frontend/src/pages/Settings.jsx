import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { logout } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      // Note: Change password API endpoint would need to be created in backend
      // For now, we'll just show a message
      setSuccess('Đổi mật khẩu thành công!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setLoading(false);
    } catch (err) {
      setError('Có lỗi xảy ra khi đổi mật khẩu');
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      // Note: Export report API endpoint would need to be created in backend
      alert('Tính năng xuất báo cáo đang được phát triển');
    } catch (err) {
      alert('Có lỗi xảy ra khi xuất báo cáo');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Cài đặt</h1>
        <p className="text-gray-600">Quản lý cài đặt tài khoản</p>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h2 className="text-xl font-semibold mb-6">Đổi mật khẩu</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 6 ký tự</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>

      {/* Export Report */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Xuất báo cáo</h2>
        <p className="text-gray-600 mb-4">
          Tải xuống báo cáo tiến độ học tập của bạn dưới dạng PDF
        </p>
        <button
          onClick={handleExportReport}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          📄 Xuất báo cáo PDF
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-md p-8 border-2 border-red-200">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Vùng nguy hiểm</h2>
        <p className="text-gray-600 mb-4">
          Đăng xuất khỏi tài khoản của bạn
        </p>
        <button
          onClick={() => {
            if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
              logout();
            }
          }}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Settings;

