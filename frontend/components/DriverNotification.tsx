import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

interface DriverNotificationProps {
  userId: string;
  userRole: string;
}

export default function DriverNotification({ userId, userRole }: DriverNotificationProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (userRole !== 'Driver') return;

    // Connect to WebSocket
    const newSocket = io('/chat', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Driver notification connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Driver notification disconnected');
      setIsConnected(false);
    });

    // Listen for forklift assignment notifications
    newSocket.on('FORKLIFT_ASSIGNMENT', (notification: Notification) => {
      console.log('Received forklift assignment:', notification);
      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5 notifications
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/sml_logo.png'
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId, userRole]);

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const requestNotificationPermission = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  if (userRole !== 'Driver') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Connection Status */}
      <div className={`mb-2 px-3 py-1 rounded-full text-xs ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? '🟢 Đã kết nối' : '🔴 Mất kết nối'}
      </div>

      {/* Notifications */}
      {notifications.map((notification, index) => (
        <div
          key={index}
          className="mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {notification.message}
              </p>
              {notification.data && (
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <div><strong>Container:</strong> {notification.data.container_no}</div>
                  <div><strong>Từ:</strong> {notification.data.source_location}</div>
                  <div><strong>Đến:</strong> {notification.data.destination_location}</div>
                  <div><strong>Gán bởi:</strong> {notification.data.assigned_by}</div>
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {new Date(notification.timestamp).toLocaleString('vi-VN')}
              </div>
            </div>
            <button
              onClick={() => removeNotification(index)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {/* Notification Permission Request */}
      {Notification.permission === 'default' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-sm">
          <p className="text-sm text-yellow-800 mb-2">
            Cho phép thông báo để nhận công việc xe nâng
          </p>
          <button
            onClick={requestNotificationPermission}
            className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700"
          >
            Cho phép
          </button>
        </div>
      )}
    </div>
  );
}
