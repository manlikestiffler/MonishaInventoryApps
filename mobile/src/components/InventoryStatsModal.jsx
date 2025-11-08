import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const ITEMS_PER_PAGE = 20;

export default function InventoryStatsModal({ 
  visible, 
  onClose, 
  title, 
  products = [], 
  type = 'all' 
}) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Reset pagination when modal opens or search changes
  useEffect(() => {
    if (visible) {
      setCurrentPage(1);
      setSearchTerm('');
    }
  }, [visible]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate stock status for a variant
  const calculateVariantStatus = (variant) => {
    if (!variant.sizes || variant.sizes.length === 0) {
      return { type: 'error', label: 'Out of Stock', count: 0 };
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
      return { type: 'error', label: 'Out of Stock', count: totalQuantity };
    } else if (hasOutOfStock || hasLowStock) {
      return { type: 'warning', label: 'Low Stock', count: totalQuantity };
    } else {
      return { type: 'success', label: 'In Stock', count: totalQuantity };
    }
  };

  // Filter products based on search term and type
  const filteredProducts = useMemo(() => {
    setIsSearching(true);
    
    let filtered = products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.gender?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filter by stock status type
      if (type === 'all') return true;
      
      if (product.variants && product.variants.length > 0) {
        return product.variants.some(variant => {
          const status = calculateVariantStatus(variant);
          return (
            (type === 'out_of_stock' && status.type === 'error') ||
            (type === 'low_stock' && status.type === 'warning') ||
            (type === 'in_stock' && status.type === 'success')
          );
        });
      }
      
      return false;
    });

    setTimeout(() => setIsSearching(false), 100);
    return filtered;
  }, [products, searchTerm, type]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Generate page numbers with ellipsis
  const generatePageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const getProductImage = (product) => {
    return product.imageUrl || 'https://via.placeholder.com/80x80?text=No+Image';
  };

  const renderProduct = ({ item: product, index }) => {
    return (
      <Card style={[
        styles.productCard,
        { 
          backgroundColor: isDarkMode ? colors.cardBackground : colors.background,
          borderColor: isDarkMode ? colors.border : colors.lightBorder,
        }
      ]}>
        <CardContent style={styles.productContent}>
          {/* Product Header */}
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Image
                source={{ uri: getProductImage(product) }}
                style={[styles.productImage, { borderColor: colors.border }]}
                resizeMode="cover"
              />
              <View style={styles.productDetails}>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                  {product.name}
                </Text>
                <View style={styles.productMeta}>
                  <Badge variant="secondary" style={styles.badge}>
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                      {product.type}
                    </Text>
                  </Badge>
                  <Badge variant="outline" style={styles.badge}>
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                      {product.level}
                    </Text>
                  </Badge>
                  <Badge variant="outline" style={styles.badge}>
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                      {product.gender}
                    </Text>
                  </Badge>
                </View>
              </View>
            </View>
          </View>

          {/* Variants */}
          {product.variants && product.variants.map((variant, idx) => {
            const variantStatus = calculateVariantStatus(variant);
            
            // Filter variants based on type
            if (type !== 'all') {
              if (
                (type === 'out_of_stock' && variantStatus.type !== 'error') ||
                (type === 'low_stock' && variantStatus.type !== 'warning') ||
                (type === 'in_stock' && variantStatus.type !== 'success')
              ) {
                return null;
              }
            }

            return (
              <View key={idx} style={[
                styles.variantCard,
                { 
                  backgroundColor: isDarkMode ? colors.surface : colors.background,
                  borderColor: colors.border,
                }
              ]}>
                <View style={styles.variantHeader}>
                  <View>
                    <Text style={[styles.variantType, { color: colors.text }]}>
                      {variant.variantType}
                    </Text>
                    <Text style={[styles.variantColor, { color: colors.textSecondary }]}>
                      {variant.color}
                    </Text>
                  </View>
                  <Badge 
                    variant={variantStatus.type === 'error' ? 'destructive' : 
                           variantStatus.type === 'warning' ? 'warning' : 'success'}
                    style={styles.statusBadge}
                  >
                    <Text style={styles.statusText}>
                      {variantStatus.count} total
                    </Text>
                  </Badge>
                </View>

                {/* Size Breakdown */}
                <View style={styles.sizesContainer}>
                  <Text style={[styles.sizesLabel, { color: colors.textSecondary }]}>
                    SIZE BREAKDOWN
                  </Text>
                  <View style={styles.sizesGrid}>
                    {variant.sizes?.map((size, sizeIdx) => (
                      <View key={sizeIdx} style={[
                        styles.sizeChip,
                        { backgroundColor: isDarkMode ? colors.border : colors.lightBackground }
                      ]}>
                        <Text style={[styles.sizeLabel, { color: colors.text }]}>
                          {size.size}
                        </Text>
                        <Text style={[
                          styles.sizeQuantity,
                          {
                            color: Number(size.quantity) === 0 ? colors.error :
                                   Number(size.quantity) <= (Number(size.reorderLevel) || 5) ? colors.warning :
                                   colors.success
                          }
                        ]}>
                          ({size.quantity})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const renderPaginationButton = (page, index) => {
    if (page === '...') {
      return (
        <Text key={index} style={[styles.ellipsis, { color: colors.textSecondary }]}>
          ...
        </Text>
      );
    }

    const isActive = currentPage === page;
    return (
      <TouchableOpacity
        key={page}
        onPress={() => setCurrentPage(page)}
        style={[
          styles.pageButton,
          {
            backgroundColor: isActive ? colors.primary : (isDarkMode ? colors.surface : colors.lightBackground),
            borderColor: colors.border,
          }
        ]}
      >
        <Text style={[
          styles.pageButtonText,
          { color: isActive ? colors.background : colors.text }
        ]}>
          {page}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: colors.background,
          borderBottomColor: colors.border 
        }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="inventory" size={24} color={colors.background} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {products.length > 10 && (
          <View style={[styles.searchContainer, { 
            backgroundColor: colors.background,
            borderBottomColor: colors.border 
          }]}>
            <View style={[styles.searchInputContainer, { 
              backgroundColor: isDarkMode ? colors.surface : colors.lightBackground,
              borderColor: colors.border 
            }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search products..."
                placeholderTextColor={colors.textSecondary}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {isSearching && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
              )}
            </View>
          </View>
        )}

        {/* Performance Indicator */}
        {filteredProducts.length > 1000 && (
          <View style={[styles.performanceIndicator, { 
            backgroundColor: isDarkMode ? colors.warningBackground : '#fef3c7',
            borderColor: colors.warning 
          }]}>
            <View style={styles.performanceContent}>
              <MaterialIcons name="speed" size={20} color={colors.warning} />
              <View style={styles.performanceText}>
                <Text style={[styles.performanceTitle, { color: colors.warning }]}>
                  Large Dataset ({filteredProducts.length.toLocaleString()} products)
                </Text>
                <Text style={[styles.performanceSubtitle, { color: colors.warning }]}>
                  Showing {ITEMS_PER_PAGE} items per page for optimal performance
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Products List */}
        <FlatList
          data={paginatedProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.lightBackground }]}>
                <MaterialIcons name="inventory" size={48} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchTerm ? 'No matching products found' : 'No products found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchTerm 
                  ? `No products match "${searchTerm}". Try a different search term.`
                  : 'There are no products matching this criteria.'
                }
              </Text>
            </View>
          )}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={[styles.paginationContainer, { 
            backgroundColor: colors.background,
            borderTopColor: colors.border 
          }]}>
            <Text style={[styles.paginationInfo, { color: colors.textSecondary }]}>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length.toLocaleString()} products
            </Text>
            
            <View style={styles.paginationControls}>
              <TouchableOpacity
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={[
                  styles.paginationButton,
                  {
                    backgroundColor: isDarkMode ? colors.surface : colors.lightBackground,
                    borderColor: colors.border,
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }
                ]}
              >
                <Text style={[styles.paginationButtonText, { color: colors.text }]}>
                  Previous
                </Text>
              </TouchableOpacity>
              
              <View style={styles.pageNumbers}>
                {generatePageNumbers().map((page, index) => renderPaginationButton(page, index))}
              </View>
              
              <TouchableOpacity
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={[
                  styles.paginationButton,
                  {
                    backgroundColor: isDarkMode ? colors.surface : colors.lightBackground,
                    borderColor: colors.border,
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }
                ]}
              >
                <Text style={[styles.paginationButtonText, { color: colors.text }]}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchLoader: {
    marginLeft: 8,
  },
  performanceIndicator: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  performanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceText: {
    marginLeft: 12,
    flex: 1,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  performanceSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  listContainer: {
    padding: 20,
  },
  productCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  productContent: {
    padding: 16,
  },
  productHeader: {
    marginBottom: 16,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  variantCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  variantType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  variantColor: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sizesContainer: {
    marginTop: 8,
  },
  sizesLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sizeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  sizeQuantity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 32,
  },
  paginationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  paginationInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ellipsis: {
    fontSize: 14,
    paddingHorizontal: 8,
  },
};
