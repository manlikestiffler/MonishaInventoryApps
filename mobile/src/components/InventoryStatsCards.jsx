import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent } from './ui/Card';
import { AnimatedCard } from './ui/AnimatedCard';

export default function InventoryStatsCards({ products = [], onCardPress }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);

  // Calculate stock status for a variant
  const calculateVariantStatus = (variant) => {
    if (!variant.sizes || variant.sizes.length === 0) {
      return { type: 'error', count: 0 };
    }

    let totalQuantity = 0;
    let hasLowStock = false;
    let hasOutOfStock = false;

    variant.sizes.forEach(size => {
      const quantity = Number(size.quantity) || 0;
      const reorderLevel = Number(size.reorderLevel) || 5;
      
      totalQuantity += quantity;
      
      if (quantity === 0) {
        hasOutOfStock = true;
      } else if (quantity <= reorderLevel) {
        hasLowStock = true;
      }
    });

    if (totalQuantity === 0) {
      return { type: 'error', count: totalQuantity };
    } else if (hasOutOfStock || hasLowStock) {
      return { type: 'warning', count: totalQuantity };
    } else {
      return { type: 'success', count: totalQuantity };
    }
  };

  // Calculate total inventory count
  const calculateTotalInventoryCount = (product) => {
    if (!product.variants) return 0;
    
    return product.variants.reduce((total, variant) => {
      if (!variant.sizes) return total;
      return total + variant.sizes.reduce((variantTotal, size) => {
        return variantTotal + (Number(size.quantity) || 0);
      }, 0);
    }, 0);
  };

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    const stats = {
      total: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalItems: 0,
    };

    const productsByStatus = {
      total: [],
      inStock: [],
      lowStock: [],
      outOfStock: [],
    };

    products.forEach(product => {
      stats.total++;
      productsByStatus.total.push(product);
      
      // Calculate total items for this product
      const productItemCount = calculateTotalInventoryCount(product);
      stats.totalItems += productItemCount;

      if (!product.variants || product.variants.length === 0) {
        stats.outOfStock++;
        productsByStatus.outOfStock.push(product);
        return;
      }

      // Check each variant's status
      let productHasStock = false;
      let productHasLowStock = false;
      let productIsOutOfStock = false;

      product.variants.forEach(variant => {
        const variantStatus = calculateVariantStatus(variant);
        
        if (variantStatus.type === 'success') {
          productHasStock = true;
        } else if (variantStatus.type === 'warning') {
          productHasLowStock = true;
        } else if (variantStatus.type === 'error') {
          productIsOutOfStock = true;
        }
      });

      // Categorize product based on worst status
      if (productIsOutOfStock && !productHasStock && !productHasLowStock) {
        stats.outOfStock++;
        productsByStatus.outOfStock.push(product);
      } else if (productHasLowStock || productIsOutOfStock) {
        stats.lowStock++;
        productsByStatus.lowStock.push(product);
      } else if (productHasStock) {
        stats.inStock++;
        productsByStatus.inStock.push(product);
      }
    });

    return { stats, productsByStatus };
  }, [products]);

  const statsCards = [
    {
      id: 'total',
      title: 'Total Products',
      count: inventoryStats.stats.total,
      subtitle: `${inventoryStats.stats.totalItems.toLocaleString()} total items`,
      icon: 'inventory',
      iconLibrary: 'MaterialIcons',
      color: colors.primary,
      backgroundColor: isDarkMode ? colors.primaryBackground : '#e0f2fe',
      products: inventoryStats.productsByStatus.total,
      type: 'all',
    },
    {
      id: 'in_stock',
      title: 'In Stock',
      count: inventoryStats.stats.inStock,
      subtitle: 'Products available',
      icon: 'checkmark-circle',
      iconLibrary: 'Ionicons',
      color: colors.success,
      backgroundColor: isDarkMode ? colors.successBackground : '#f0fdf4',
      products: inventoryStats.productsByStatus.inStock,
      type: 'in_stock',
    },
    {
      id: 'low_stock',
      title: 'Low Stock',
      count: inventoryStats.stats.lowStock,
      subtitle: 'Need reordering',
      icon: 'warning',
      iconLibrary: 'Ionicons',
      color: colors.warning,
      backgroundColor: isDarkMode ? colors.warningBackground : '#fefce8',
      products: inventoryStats.productsByStatus.lowStock,
      type: 'low_stock',
    },
    {
      id: 'out_of_stock',
      title: 'Out of Stock',
      count: inventoryStats.stats.outOfStock,
      subtitle: 'Urgent attention needed',
      icon: 'alert-circle',
      iconLibrary: 'Ionicons',
      color: colors.error,
      backgroundColor: isDarkMode ? colors.errorBackground : '#fef2f2',
      products: inventoryStats.productsByStatus.outOfStock,
      type: 'out_of_stock',
    },
  ];

  const renderIcon = (iconName, iconLibrary, color, size = 24) => {
    if (iconLibrary === 'MaterialIcons') {
      return <MaterialIcons name={iconName} size={size} color={color} />;
    }
    return <Ionicons name={iconName} size={size} color={color} />;
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {statsCards.map((card, index) => (
        <AnimatedCard
          key={card.id}
          delay={index * 100}
          style={[
            styles.card,
            {
              backgroundColor: card.backgroundColor,
              borderColor: isDarkMode ? colors.border : colors.lightBorder,
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => onCardPress?.(card.title, card.products, card.type)}
            style={styles.cardTouchable}
            activeOpacity={0.7}
          >
            <CardContent style={styles.cardContent}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: card.color }]}>
                {renderIcon(card.icon, card.iconLibrary, colors.background, 28)}
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <Text style={[styles.count, { color: card.color }]}>
                  {card.count.toLocaleString()}
                </Text>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {card.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {card.subtitle}
                </Text>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </View>
            </CardContent>
          </TouchableOpacity>
        </AnimatedCard>
      ))}
    </ScrollView>
  );
}

const styles = {
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  card: {
    width: 280,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTouchable: {
    flex: 1,
  },
  cardContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  count: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  arrowContainer: {
    marginLeft: 8,
  },
};
