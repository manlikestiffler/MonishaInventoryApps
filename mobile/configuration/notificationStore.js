import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isEnabled: true,
      expoPushToken: null,
      
      // Set push token
      setExpoPushToken: (token) => {
        set({ expoPushToken: token });
      },
      
      // Add a new notification
      addNotification: async (notification, userInfo) => {
        const newNotification = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          read: false,
          userId: userInfo?.id || 'unknown',
          userName: userInfo?.name || userInfo?.fullName || 'Unknown User',
          userEmail: userInfo?.email || '',
          ...notification
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep only last 100
          unreadCount: state.unreadCount + 1
        }));
        
        // Show local notification if enabled
        if (get().isEnabled) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.message,
              data: { 
                type: notification.type,
                category: notification.category,
                priority: notification.priority 
              },
            },
            trigger: null, // Show immediately
          });
        }
      },
      
      // Mark notification as read
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      },
      
      // Mark all notifications as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(notif => ({ ...notif, read: true })),
          unreadCount: 0
        }));
      },
      
      // Remove notification
      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          return {
            notifications: state.notifications.filter(notif => notif.id !== id),
            unreadCount: notification && !notification.read ? 
              Math.max(0, state.unreadCount - 1) : state.unreadCount
          };
        });
      },
      
      // Clear all notifications
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },
      
      // Toggle notifications
      toggleNotifications: () => {
        set((state) => ({ isEnabled: !state.isEnabled }));
      },
      
      // Request permission for notifications
      requestPermission: async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        return finalStatus === 'granted';
      },
      
      // Register for push notifications
      registerForPushNotifications: async () => {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          
          if (finalStatus !== 'granted') {
            return false;
          }
          
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          get().setExpoPushToken(token);
          return token;
        } catch (error) {
          console.error('Error registering for push notifications:', error);
          return false;
        }
      },
      
      // Predefined notification creators
      createBatchNotification: (batchName, productCount, userInfo) => {
        get().addNotification({
          type: 'batch_created',
          title: 'New Batch Created',
          message: `Batch "${batchName}" created with ${productCount} products`,
          category: 'inventory',
          priority: 'medium',
          icon: '📦'
        }, userInfo);
      },
      
      createProductNotification: (productName, type, userInfo) => {
        get().addNotification({
          type: 'product_created',
          title: 'New Product Added',
          message: `${type} "${productName}" has been added to inventory`,
          category: 'inventory',
          priority: 'medium',
          icon: '👕'
        }, userInfo);
      },
      
      createStockUpdateNotification: (productName, variantType, sizesAdded, userInfo) => {
        get().addNotification({
          type: 'stock_updated',
          title: 'Stock Updated',
          message: `${productName} (${variantType}) received ${sizesAdded} new items`,
          category: 'inventory',
          priority: 'low',
          icon: '📈'
        }, userInfo);
      },
      
      createSchoolNotification: (schoolName, userInfo) => {
        get().addNotification({
          type: 'school_added',
          title: 'New School Added',
          message: `${schoolName} has been added to the system`,
          category: 'administration',
          priority: 'medium',
          icon: '🏫'
        }, userInfo);
      },
      
      createStudentNotification: (studentName, schoolName, userInfo) => {
        get().addNotification({
          type: 'student_added',
          title: 'New Student Registered',
          message: `${studentName} has been registered at ${schoolName}`,
          category: 'administration',
          priority: 'low',
          icon: '👤'
        }, userInfo);
      },
      
      createLowStockNotification: (productName, currentStock, userInfo) => {
        get().addNotification({
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${productName} is running low (${currentStock} items remaining)`,
          category: 'alert',
          priority: 'high',
          icon: '⚠️'
        }, userInfo);
      },
      
      createOrderNotification: (orderNumber, customerName, userInfo) => {
        get().addNotification({
          type: 'order_created',
          title: 'New Order Received',
          message: `Order #${orderNumber} from ${customerName}`,
          category: 'orders',
          priority: 'medium',
          icon: '🛍️'
        }, userInfo);
      }
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        isEnabled: state.isEnabled,
        expoPushToken: state.expoPushToken
      })
    }
  )
);

export default useNotificationStore;
