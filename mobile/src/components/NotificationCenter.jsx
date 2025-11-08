import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import useNotificationStore from '../../configuration/notificationStore';

const { width: screenWidth } = Dimensions.get('window');

export default function NotificationCenter() {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const scaleAnim = new Animated.Value(1);
  
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
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.category === filter;
  });

  const getNotificationIcon = (type) => {
    const iconMap = {
      batch_created: 'cube-outline',
      product_created: 'shirt-outline',
      stock_updated: 'trending-up-outline',
      school_added: 'school-outline',
      student_added: 'person-outline',
      low_stock: 'warning-outline',
      order_created: 'bag-outline'
    };
    return iconMap[type] || 'notifications-outline';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
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

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    setIsOpen(true);
  };

  const renderFilterTab = (tab) => {
    const isActive = filter === tab;
    return (
      <TouchableOpacity
        key={tab}
        onPress={() => setFilter(tab)}
        style={[
          styles.filterTab,
          {
            backgroundColor: isActive ? colors.primary : 'transparent',
            borderColor: colors.border,
          }
        ]}
      >
        <Text style={[
          styles.filterTabText,
          { color: isActive ? colors.background : colors.textSecondary }
        ]}>
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderNotification = ({ item: notification }) => (
    <Card style={[
      styles.notificationCard,
      {
        backgroundColor: notification.read 
          ? colors.background 
          : isDarkMode ? colors.primaryBackground : '#f0f9ff',
        borderColor: colors.border,
      }
    ]}>
      <CardContent style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons 
              name={getNotificationIcon(notification.type)} 
              size={24} 
              color={colors.primary} 
            />
          </View>
          
          <View style={styles.notificationBody}>
            <View style={styles.notificationTitleRow}>
              <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>
                {notification.title}
              </Text>
              <View style={styles.notificationMeta}>
                <Badge 
                  variant={notification.priority === 'high' ? 'destructive' : 
                          notification.priority === 'medium' ? 'warning' : 'success'}
                  style={styles.priorityBadge}
                >
                  <Text style={styles.priorityText}>
                    {notification.priority?.toUpperCase()}
                  </Text>
                </Badge>
                {!notification.read && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </View>
            
            <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
              {notification.message}
            </Text>
            
            <View style={styles.notificationFooter}>
              <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                {formatTime(notification.timestamp)}
              </Text>
              
              <View style={styles.notificationActions}>
                {!notification.read && (
                  <TouchableOpacity
                    onPress={() => markAsRead(notification.id)}
                    style={[styles.actionButton, { backgroundColor: colors.primaryBackground }]}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => removeNotification(notification.id)}
                  style={[styles.actionButton, { backgroundColor: colors.errorBackground }]}
                >
                  <Ionicons name="close" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View>
      {/* Notification Bell */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          style={[styles.bellButton, { backgroundColor: colors.lightBackground }]}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={[styles.badgeText, { color: colors.background }]}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Notification Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { 
            backgroundColor: colors.background,
            borderBottomColor: colors.border 
          }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Notifications
              </Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Filter Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
            >
              {['all', 'unread', 'inventory', 'administration', 'alert'].map(renderFilterTab)}
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={[styles.actionsContainer, { 
            backgroundColor: colors.background,
            borderBottomColor: colors.border 
          }]}>
            <View style={styles.actionsLeft}>
              <TouchableOpacity
                onPress={markAllAsRead}
                disabled={unreadCount === 0}
                style={[
                  styles.actionBtn,
                  { 
                    backgroundColor: colors.primaryBackground,
                    opacity: unreadCount === 0 ? 0.5 : 1 
                  }
                ]}
              >
                <Ionicons name="checkmark-done" size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  Mark all read
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={clearAll}
                disabled={notifications.length === 0}
                style={[
                  styles.actionBtn,
                  { 
                    backgroundColor: colors.errorBackground,
                    opacity: notifications.length === 0 ? 0.5 : 1 
                  }
                ]}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.actionBtnText, { color: colors.error }]}>
                  Clear all
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={toggleNotifications}
              style={[
                styles.actionBtn,
                { 
                  backgroundColor: isEnabled ? colors.successBackground : colors.lightBackground 
                }
              ]}
            >
              <Ionicons 
                name="settings-outline" 
                size={16} 
                color={isEnabled ? colors.success : colors.textSecondary} 
              />
              <Text style={[
                styles.actionBtnText,
                { color: isEnabled ? colors.success : colors.textSecondary }
              ]}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.lightBackground }]}>
                <Ionicons name="notifications-outline" size={48} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No notifications
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {filter === 'unread' ? 'All caught up!' : 'You\'ll see notifications here when they arrive'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredNotifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  filterContainer: {
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  actionsLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationBody: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
};
