import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useNotificationStore } from '../../configuration/notificationStore';

export default function NotificationScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const [filter, setFilter] = useState('all');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const {
    notifications,
    unreadCount,
    isEnabled,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleNotifications,
    requestPermission
  } = useNotificationStore();

  useEffect(() => {
    // Request notification permission on mount
    requestPermission();
    
    // Start fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.category === filter;
  });

  const getNotificationIcon = (type) => {
    const iconMap = {
      batch_created: 'cube-outline',
      batch_deleted: 'trash-outline',
      product_created: 'shirt-outline',
      product_deleted: 'trash-outline',
      stock_updated: 'trending-up-outline',
      school_added: 'school-outline',
      school_deleted: 'trash-outline',
      student_added: 'person-outline',
      low_stock: 'warning-outline',
      order_created: 'bag-outline'
    };
    return iconMap[type] || 'notifications-outline';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const renderFilterTab = (tab) => {
    const isActive = filter === tab;
    return (
      <TouchableOpacity
        key={tab}
        onPress={() => setFilter(tab)}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          backgroundColor: isActive ? colors.primary : 'transparent',
          borderColor: colors.border,
          marginRight: 8,
        }}
      >
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: isActive ? colors.primaryForeground : colors.mutedForeground
        }}>
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderNotification = ({ item: notification }) => (
    <Card style={{
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: notification.read 
        ? colors.card 
        : isDarkMode ? colors.primary + '20' : '#f0f9ff',
      borderColor: colors.border,
    }}>
      <CardContent style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}>
            <Ionicons 
              name={getNotificationIcon(notification.type)} 
              size={20} 
              color={colors.primary} 
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                flex: 1,
              }} numberOfLines={1}>
                {notification.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Badge 
                  variant={notification.priority === 'high' ? 'destructive' : 
                          notification.priority === 'medium' ? 'warning' : 'success'}
                  style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                    {notification.priority?.toUpperCase()}
                  </Text>
                </Badge>
                {!notification.read && (
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary
                  }} />
                )}
              </View>
            </View>
            
            <Text style={{
              fontSize: 14,
              color: colors.mutedForeground,
              marginBottom: 8,
              lineHeight: 20,
            }} numberOfLines={2}>
              {notification.message}
            </Text>
            
            {notification.userName && (
              <Text style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontStyle: 'italic',
                marginBottom: 8,
              }}>
                by {notification.userName}
              </Text>
            )}
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Text style={{
                fontSize: 12,
                color: colors.mutedForeground,
              }}>
                {formatTime(notification.timestamp)}
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {!notification.read && (
                  <TouchableOpacity
                    onPress={() => markAsRead(notification.id)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.primary + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => removeNotification(notification.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.destructive + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 20, 
        paddingBottom: 20,
        backgroundColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              borderRadius: 8, 
              padding: 8,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 40 }}>
            <Text style={{
              fontSize: 22,
              fontWeight: '800',
              color: 'white',
              marginBottom: 4,
              letterSpacing: 0.5
            }}>
              Notifications
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '500',
              letterSpacing: 0.2
            }}>
              {unreadCount} unread notifications
            </Text>
          </View>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Filter Tabs */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            {['all', 'unread', 'inventory', 'administration', 'alert'].map(renderFilterTab)}
          </ScrollView>
        </View>

        {/* Actions */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={markAllAsRead}
              disabled={unreadCount === 0}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: colors.primary + '20',
                opacity: unreadCount === 0 ? 0.5 : 1,
                gap: 4,
              }}
            >
              <Ionicons name="checkmark-done" size={16} color={colors.primary} />
              <Text style={{
                fontSize: 12,
                fontWeight: '500',
                color: colors.primary
              }}>
                Mark all read
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={clearAll}
              disabled={notifications.length === 0}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: colors.destructive + '20',
                opacity: notifications.length === 0 ? 0.5 : 1,
                gap: 4,
              }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
              <Text style={{
                fontSize: 12,
                fontWeight: '500',
                color: colors.destructive
              }}>
                Clear all
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={toggleNotifications}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: isEnabled ? colors.success + '20' : colors.mutedForeground + '20',
              gap: 4,
            }}
          >
            <Ionicons 
              name="settings-outline" 
              size={16} 
              color={isEnabled ? colors.success : colors.mutedForeground} 
            />
            <Text style={{
              fontSize: 12,
              fontWeight: '500',
              color: isEnabled ? colors.success : colors.mutedForeground
            }}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}>
            <View style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="notifications-outline" size={48} color={colors.mutedForeground} />
            </View>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.foreground,
              marginBottom: 8,
            }}>
              No notifications
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.mutedForeground,
              textAlign: 'center',
            }}>
              {filter === 'unread' ? 'All caught up!' : 'You\'ll see notifications here when they arrive'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </View>
  );
}
