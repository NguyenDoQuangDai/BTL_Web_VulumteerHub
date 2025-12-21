import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { pushNotificationService } from '../../services/apiService';
import './settings.css';

// Helper functions
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const PushNotificationSettings = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [subscriptionCreated, setSubscriptionCreated] = useState(false);
  const [subscriptionSaved, setSubscriptionSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [vapidPublicKey, setVapidPublicKey] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showFullEndpoint, setShowFullEndpoint] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([
          fetchVapidKey(),
          checkNotificationStatus()
        ]);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setChecking(false);
      }
    };
    initialize();
  }, []);

  const fetchVapidKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/webpush/public-key', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch VAPID key');
      }
      
      const data = await response.json();
      console.log('VAPID key fetched:', data.publicKey);
      setVapidPublicKey(data.publicKey);
    } catch (error) {
      console.error('Failed to fetch VAPID key:', error);
    }
  };

  const checkNotificationStatus = async () => {
    console.log('Checking notification status...');
    
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    const permission = Notification.permission;
    console.log('Permission status:', permission);
    setPermissionGranted(permission === 'granted');
    
    if (permission === 'granted') {
      await checkExistingSubscription();
    }
  };

  const checkExistingSubscription = async () => {
    console.log('Checking existing subscription...');
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Service Worker or Push Manager not supported');
      return;
    }

    try {
      // Try to get existing registration without waiting indefinitely
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log('No service worker registration found');
        setSubscriptionCreated(false);
        setSubscriptionSaved(false);
        return;
      }

      console.log('Service worker registration found');
      
      // Get subscription with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const subscriptionPromise = registration.pushManager.getSubscription();
      
      const sub = await Promise.race([subscriptionPromise, timeoutPromise]);
      
      console.log('Existing subscription:', sub);
      
      if (sub) {
        setSubscription(sub);
        setSubscriptionCreated(true);
        
        // Verify subscription with backend
        try {
          const token = localStorage.getItem('token');
          
          // Convert subscription to proper format
          const subscriptionData = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
              auth: arrayBufferToBase64(sub.getKey('auth'))
            }
          };
          
          console.log('Verifying subscription with endpoint:', sub.endpoint.substring(0, 50) + '...');
          
          const response = await fetch('/api/webpush/verify-subscription', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscriptionData)
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Verification response received');
            console.log('Response data:', JSON.stringify(data));
            console.log('data.exists type:', typeof data.exists);
            console.log('data.exists value:', data.exists);
            
            if (data.exists === true) {
              console.log('✅ Setting subscriptionSaved to TRUE');
              setSubscriptionSaved(true);
              console.log('✅ Subscription verified successfully - exists in backend');
            } else {
              console.log('❌ Setting subscriptionSaved to FALSE');
              setSubscriptionSaved(false);
              console.log('❌ Subscription exists in browser but not in backend');
            }
          } else {
            console.log('Verification failed with status:', response.status);
            setSubscriptionSaved(false);
          }
        } catch (error) {
          console.error('Error verifying subscription:', error);
          // Assume not saved if verification fails
          setSubscriptionSaved(false);
        }
      } else {
        console.log('No existing subscription found');
        setSubscriptionCreated(false);
        setSubscriptionSaved(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionCreated(false);
      setSubscriptionSaved(false);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Trình duyệt không hỗ trợ thông báo đẩy');
      return;
    }

    setLoading(true);
    
    try {
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      
      if (permission !== 'granted') {
        alert('Bạn đã từ chối quyền thông báo. Vui lòng bật lại trong cài đặt trình duyệt.');
        setLoading(false);
        return;
      }

      setPermissionGranted(true);
      
    } catch (error) {
      console.error('Error requesting permission:', error);
      alert('Không thể yêu cầu quyền thông báo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!permissionGranted) {
      alert('Vui lòng cấp quyền thông báo trước');
      return;
    }

    if (!vapidPublicKey) {
      alert('Chưa tải được khóa VAPID từ máy chủ. Vui lòng thử lại.');
      return;
    }

    setLoading(true);
    
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Get or register service worker
        let registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          try {
            console.log('Registering service worker...');
            registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service worker registered successfully');
            // Wait a bit for it to activate
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (swError) {
            console.error('Service worker registration failed:', swError);
            throw new Error('Không thể đăng ký service worker: ' + swError.message);
          }
        }

        console.log('Service worker ready');
        
        // Check if subscription already exists
        let sub = await registration.pushManager.getSubscription();
        
        // If subscription exists but not saved in backend, just re-save it
        if (sub && subscriptionCreated && !subscriptionSaved) {
          console.log('Re-saving existing subscription to backend...');
        } else {
          // Create new subscription
          if (sub) {
            console.log('Unsubscribing from existing subscription...');
            await sub.unsubscribe();
          }
          
          // Convert VAPID public key to Uint8Array
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          
          // Subscribe to push notifications
          console.log('Creating new push subscription...');
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });

          console.log('Push subscription created:', sub.endpoint);
          setSubscriptionCreated(true);
        }
        
        setSubscription(sub);
        
        // Send subscription to server
        console.log('Sending subscription to server...');
        await pushNotificationService.subscribe(sub);
        setSubscriptionSaved(true);
        
        alert('Đăng ký thông báo đẩy thành công!');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Không thể tạo đăng ký: ' + error.message);
      
      if (!subscription) {
        setSubscriptionCreated(false);
      }
      setSubscriptionSaved(false);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!subscriptionSaved) {
      alert('Vui lòng hoàn tất đăng ký thông báo trước');
      return;
    }

    setTestLoading(true);
    try {
      console.log('Sending test notification request...');
      await pushNotificationService.sendTest();
      console.log('Test notification request sent successfully');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Không thể gửi thông báo thử: ' + error.message);
    } finally {
      setTestLoading(false);
    }
  };

  if (checking) {
    return (
      <div className='p-4 bg-white rounded shadow-sm text-center'>
        <FontAwesomeIcon icon={faSpinner} spin className='text-primary' size='2x' />
        <p className='mt-3 text-muted'>Đang kiểm tra trạng thái thông báo...</p>
      </div>
    );
  }

  return (
    <div className='p-4 bg-white rounded shadow-sm'>
      <h5 className='mb-4'>Cài đặt thông báo đẩy</h5>
      
      <div className='mb-4'>
        <p className='text-muted'>
          Nhận thông báo về các sự kiện, cập nhật và thông tin quan trọng ngay trên thiết bị của bạn.
        </p>
      </div>

      {/* Action Buttons */}
      <div className='mb-4 d-flex gap-3'>
        <button
          className={`btn ${permissionGranted ? 'btn-success' : 'btn-primary'}`}
          onClick={requestPermission}
          disabled={loading || permissionGranted}
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className='mr-2' />
              Đang xử lý...
            </>
          ) : permissionGranted ? (
            <>
              <FontAwesomeIcon icon={faCheck} className='mr-2' />
              Đã cấp quyền
            </>
          ) : (
            'Cấp quyền thông báo'
          )}
        </button>

        <button
          className={`btn ${subscriptionSaved ? 'btn-success' : 'btn-info'}`}
          onClick={createSubscription}
          disabled={!permissionGranted || loading || !vapidPublicKey}
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className='mr-2' />
              Đang đăng ký...
            </>
          ) : subscriptionSaved ? (
            <>
              <FontAwesomeIcon icon={faCheck} className='mr-2' />
              Đã đăng ký
            </>
          ) : subscriptionCreated ? (
            'Lưu lại đăng ký'
          ) : (
            'Đăng ký nhận thông báo'
          )}
        </button>

        <button
          className='btn btn-outline-primary'
          onClick={sendTestNotification}
          disabled={testLoading || !subscriptionSaved}
        >
          {testLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className='mr-2' />
              Đang gửi...
            </>
          ) : (
            'Nhận thử thông báo'
          )}
        </button>
      </div>

      {/* Status Indicators */}
      <div className='notification-status'>
        <h6 className='text-muted mb-3'>Trạng thái kết nối:</h6>
        
        <div className='status-item mb-3 p-3 rounded' style={{ backgroundColor: permissionGranted ? '#d4edda' : '#f8d7da' }}>
          <FontAwesomeIcon 
            icon={permissionGranted ? faCheck : faTimes} 
            className={permissionGranted ? 'text-success' : 'text-danger'}
            style={{ fontSize: '1.2rem', marginRight: '10px' }}
          />
          <span className={permissionGranted ? 'text-success' : 'text-danger'}>
            {permissionGranted 
              ? 'Bạn đã cấp quyền nhận thông báo thành công' 
              : 'Chưa cấp quyền nhận thông báo'}
          </span>
        </div>

        <div className='status-item mb-3 p-3 rounded' style={{ backgroundColor: subscriptionCreated ? '#d4edda' : '#f8d7da' }}>
          <FontAwesomeIcon 
            icon={subscriptionCreated ? faCheck : faTimes} 
            className={subscriptionCreated ? 'text-success' : 'text-danger'}
            style={{ fontSize: '1.2rem', marginRight: '10px' }}
          />
          <span className={subscriptionCreated ? 'text-success' : 'text-danger'}>
            {subscriptionCreated 
              ? 'Trình duyệt đã tạo thành công điểm nhận đầu cuối' 
              : 'Chưa tạo điểm nhận đầu cuối'}
          </span>
        </div>

        <div className='status-item mb-3 p-3 rounded' style={{ backgroundColor: subscriptionSaved ? '#d4edda' : '#f8d7da' }}>
          <FontAwesomeIcon 
            icon={subscriptionSaved ? faCheck : faTimes} 
            className={subscriptionSaved ? 'text-success' : 'text-danger'}
            style={{ fontSize: '1.2rem', marginRight: '10px' }}
          />
          <span className={subscriptionSaved ? 'text-success' : 'text-danger'}>
            {subscriptionSaved 
              ? 'Volunteer Network đã nhận được và lưu lại điểm nhận đầu cuối của thiết bị này' 
              : 'Chưa lưu điểm nhận đầu cuối trên máy chủ'}
          </span>
        </div>
      </div>

      {/* Subscription Info */}
      {subscription && (
        <div className='mt-4 p-3 bg-light rounded'>
          <h6 className='text-muted mb-2'>Thông tin đăng ký:</h6>
          <div className='small text-muted'>
            <strong>Endpoint:</strong> 
            <code className='small d-inline' style={{ wordBreak: 'break-all' }}>
              {showFullEndpoint ? subscription.endpoint : subscription.endpoint.substring(0, 50) + '...'}
            </code>
            <button 
              className='btn btn-link p-0 ml-2' 
              style={{ fontSize: 'inherit', verticalAlign: 'baseline' }}
              onClick={() => setShowFullEndpoint(!showFullEndpoint)}
            >
              {showFullEndpoint ? 'Ẩn bớt' : 'Hiển thị tất cả'}
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className='mt-4 p-3 bg-light rounded'>
        <h6 className='text-muted'>Lưu ý:</h6>
        <ul className='text-muted small mb-0'>
          <li>Bước 1: Cấp quyền thông báo từ trình duyệt</li>
          <li>Bước 2: Đăng ký nhận thông báo (tạo và lưu điểm nhận)</li>
          <li>Bước 3: Gửi thông báo thử để kiểm tra</li>
          <li>Nếu không nhận được thông báo, hãy thử đăng ký lại</li>
          <li>Bạn có thể tắt thông báo bất kỳ lúc nào trong cài đặt trình duyệt</li>
        </ul>
      </div>
    </div>
  );
};

export default PushNotificationSettings;
