import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import SettingsSidebar from './settingsSidebar';
import PushNotificationSettings from './pushNotificationSettings';
import './settings.css';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = React.useState('notifications');

  const renderContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <PushNotificationSettings />;
      case 'account':
        return (
          <div className='p-4'>
            <h6>Tài khoản</h6>
            <p className='text-muted'>Cài đặt tài khoản sẽ được thêm ở đây.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className='container-fluid' style={{ minHeight: '80vh', backgroundColor: '#f0f2f5' }}>
        <div className='row'>
          <div className='col-md-2 p-0'>
            <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          <div className='col-md-10'>
            <div className='settings-content'>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SettingsPage;
