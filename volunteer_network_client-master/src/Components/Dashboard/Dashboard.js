import React from 'react';
import Header from '../Header/Header';  // Sửa: bỏ bớt một cấp ../
import DashboardOverview from './DashboardOverview';  // Sửa: cùng thư mục
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { isAuthenticated, loading } = useAuth();

  // Đợi kiểm tra auth
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect nếu chưa đăng nhập
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="dashboard-page">
      <Header />
      <div className="container mt-4">
        <DashboardOverview />
      </div>
    </div>
  );
};

export default Dashboard;