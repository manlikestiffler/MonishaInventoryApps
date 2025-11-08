import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useInventoryStore } from '../../configuration/inventoryStore';
import { useAuthStore } from '../../configuration/authStore';
import useNotificationStore from '../../configuration/notificationStore';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';

const ReorderModal = ({ isVisible, onClose, variant, size, currentStock, reorderLevel, batchId, product }) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const [quantityToReorder, setQuantityToReorder] = useState(1);
  const [loading, setLoading] = useState(false);
  const [batchStock, setBatchStock] = useState(null);
  const [loadingBatchStock, setLoadingBatchStock] = useState(false);
  const [noBatchIdError, setNoBatchIdError] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(variant);
  const [selectedSize, setSelectedSize] = useState(size);
  const [selectedCurrentStock, setSelectedCurrentStock] = useState(currentStock);
  const [selectedReorderLevel, setSelectedReorderLevel] = useState(reorderLevel);
  const { reorderFromBatch } = useInventoryStore();
  const { user } = useAuthStore();
  const { createStockUpdateNotification } = useNotificationStore();

  useEffect(() => {
    if (isVisible) {
      setQuantityToReorder(1);
      fetchBatchStock();
    }
  }, [isVisible, selectedReorderLevel, selectedVariant, selectedSize]);

  useEffect(() => {
    if (selectedReorderLevel && quantityToReorder === 0) {
      setQuantityToReorder(1);
    }
  }, [selectedReorderLevel]);

  // Handle variant change
  const handleVariantChange = (variantId) => {
    const newVariant = product?.variants?.find(v => v.id === variantId || `${product.id}-${v.variantType}` === variantId);
    if (newVariant && newVariant.sizes && newVariant.sizes.length > 0) {
      const firstSize = newVariant.sizes[0];
      setSelectedVariant({
        id: newVariant.id || `${product.id}-${newVariant.variantType}`,
        color: newVariant.color,
        variantType: newVariant.variantType
      });
      setSelectedSize(firstSize.size);
      setSelectedCurrentStock(firstSize.quantity || 0);
      setSelectedReorderLevel(firstSize.reorderLevel || newVariant.defaultReorderLevel || 5);
    }
  };

  // Handle size change
  const handleSizeChange = (sizeValue) => {
    const currentVariant = product?.variants?.find(v => 
      v.id === selectedVariant.id || `${product.id}-${v.variantType}` === selectedVariant.id
    );
    const sizeData = currentVariant?.sizes?.find(s => s.size === sizeValue);
    if (sizeData) {
      setSelectedSize(sizeValue);
      setSelectedCurrentStock(sizeData.quantity || 0);
      setSelectedReorderLevel(sizeData.reorderLevel || currentVariant.defaultReorderLevel || 5);
    }
  };

  // Check if quantity exceeds batch stock
  const isQuantityExceedingBatch = batchStock !== null && quantityToReorder > batchStock;
  const isQuantityValid = quantityToReorder > 0 && !isQuantityExceedingBatch;

  const fetchBatchStock = async () => {
    if (!batchId || !selectedVariant) {
      console.error('Missing batchId or variant:', { batchId, selectedVariant });
      setNoBatchIdError(true);
      return;
    }

    setLoadingBatchStock(true);
    try {
      const batchRef = doc(db, 'batchInventory', batchId);
      const batchDoc = await getDoc(batchRef);
      
      if (!batchDoc.exists()) {
        Alert.alert('Error', 'Batch inventory not found');
        return;
      }
      
      const batchData = batchDoc.data();
      
      const matchingItem = batchData.items?.find(item => 
        item.variantType === selectedVariant.variantType && item.color === selectedVariant.color
      );
      
      if (matchingItem) {
        const matchingSize = matchingItem.sizes?.find(s => s.size === selectedSize);
        if (matchingSize) {
          setBatchStock(matchingSize.quantity);
        } else {
          setBatchStock(null);
        }
      } else {
        setBatchStock(null);
      }
    } catch (error) {
      console.error('Error fetching batch stock:', error);
      Alert.alert('Error', 'Failed to fetch batch inventory');
    } finally {
      setLoadingBatchStock(false);
    }
  };

  const handleReorder = async () => {
    if (!batchId) {
      Alert.alert('Error', 'No batch ID found. Cannot receive stock.');
      return;
    }

    if (quantityToReorder <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (batchStock !== null && quantityToReorder > batchStock) {
      Alert.alert('Error', `Cannot receive ${quantityToReorder} units. Only ${batchStock} available in batch.`);
      return;
    }

    setLoading(true);
    try {
      await reorderFromBatch(
        selectedVariant.id,
        batchId,
        selectedSize,
        quantityToReorder,
        user?.uid || 'unknown',
        user?.email || 'Unknown User'
      );

      // Create notification for stock update
      createStockUpdateNotification(
        product?.name || 'Product',
        selectedVariant.color,
        selectedSize,
        quantityToReorder
      );

      Alert.alert('Success', `Successfully received ${quantityToReorder} units of ${selectedVariant.color} - Size ${selectedSize}`);
      onClose();
    } catch (error) {
      console.error('Reorder error:', error);
      Alert.alert('Error', error.message || 'Failed to receive stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  const stockStatus = selectedCurrentStock === 0 ? 'OUT_OF_STOCK' : selectedCurrentStock <= selectedReorderLevel ? 'LOW_STOCK' : 'IN_STOCK';

  // Show error if no batch ID is available
  if (noBatchIdError) {
    return (
      <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                backgroundColor: '#ef4444',
                borderRadius: 12,
                padding: 12,
                marginRight: 12
              }}>
                <Ionicons name="warning" size={24} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground }}>
                  Cannot Receive Stock
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Missing Batch Information
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            <View style={{
              backgroundColor: '#fef2f2',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#fecaca'
            }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#991b1b', marginBottom: 8 }}>
                🚫 Product Not Linked to Batch
              </Text>
              <Text style={{ fontSize: 14, color: '#7f1d1d', marginBottom: 12 }}>
                This product doesn't have batch information attached to it. To enable receiving stock:
              </Text>
              <View style={{ marginLeft: 8 }}>
                <Text style={{ fontSize: 14, color: '#7f1d1d', marginBottom: 4 }}>
                  • Delete this product and recreate it from a batch, OR
                </Text>
                <Text style={{ fontSize: 14, color: '#7f1d1d' }}>
                  • Manually add stock by editing the product quantities
                </Text>
              </View>
            </View>

            {/* Product Info */}
            <View style={{
              backgroundColor: colors.muted,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.mutedForeground, fontWeight: '500' }}>Color:</Text>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{selectedVariant?.color || 'N/A'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.mutedForeground, fontWeight: '500' }}>Size:</Text>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{selectedSize}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.mutedForeground, fontWeight: '500' }}>Current Stock:</Text>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{selectedCurrentStock}</Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: colors.secondary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: colors.secondaryForeground, fontSize: 16, fontWeight: '600' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: colors.card,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '90%',
          paddingBottom: 34 // Safe area padding
        }}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 24 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                backgroundColor: stockStatus === 'OUT_OF_STOCK' ? '#ef4444' :
                               stockStatus === 'LOW_STOCK' ? '#f59e0b' : '#10b981',
                borderRadius: 12,
                padding: 12,
                marginRight: 12
              }}>
                <Ionicons name="cube" size={24} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>
                    Receive Stock
                  </Text>
                  <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginLeft: 8 }} />
                </View>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  {selectedVariant.color} • Size {selectedSize}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Single Variant Info */}
            {product?.variants && product.variants.length === 1 && (
              <View style={{
                backgroundColor: '#eff6ff',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#dbeafe'
              }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e40af', textAlign: 'center', marginBottom: 8 }}>
                  📦 {selectedVariant.color} - {selectedVariant.variantType}
                </Text>
                <Text style={{ fontSize: 14, color: '#3730a3', textAlign: 'center', marginBottom: 12 }}>
                  Available sizes: {product.variants[0].sizes?.map(s => `${s.size} (${s.quantity || 0})`).join(', ')}
                </Text>
                {product.variants[0].sizes && product.variants[0].sizes.length > 1 && (
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 }}>
                      Select Size
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {product.variants[0].sizes.map((s) => (
                        <TouchableOpacity
                          key={s.size}
                          onPress={() => handleSizeChange(s.size)}
                          style={{
                            backgroundColor: selectedSize === s.size ? colors.primary : colors.muted,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderWidth: 1,
                            borderColor: selectedSize === s.size ? colors.primary : colors.border
                          }}
                        >
                          <Text style={{
                            color: selectedSize === s.size ? colors.primaryForeground : colors.foreground,
                            fontSize: 12,
                            fontWeight: '600'
                          }}>
                            Size {s.size} ({s.quantity || 0})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Batch Stock Info */}
            {loadingBatchStock ? (
              <View style={{
                backgroundColor: colors.muted,
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                alignItems: 'center'
              }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.mutedForeground, marginTop: 8, fontWeight: '500' }}>
                  Loading batch inventory...
                </Text>
              </View>
            ) : batchStock !== null ? (
              <View style={{
                backgroundColor: '#eff6ff',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                borderWidth: 2,
                borderColor: '#3b82f6'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e40af' }}>
                    📦 Available in Batch
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>
                    {batchStock}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#1e40af' }}>
                  Size {selectedSize} • {selectedVariant.color}
                </Text>
              </View>
            ) : (
              <View style={{
                backgroundColor: '#fef3c7',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                borderWidth: 2,
                borderColor: '#f59e0b'
              }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#92400e' }}>
                  ⚠️ Could not find batch inventory for this item
                </Text>
              </View>
            )}

            {/* Stock Status Alert */}
            <View style={{
              backgroundColor: stockStatus === 'OUT_OF_STOCK' ? '#fef2f2' :
                             stockStatus === 'LOW_STOCK' ? '#fef3c7' : '#f0fdf4',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: stockStatus === 'OUT_OF_STOCK' ? '#fecaca' :
                          stockStatus === 'LOW_STOCK' ? '#fde68a' : '#bbf7d0'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons 
                  name="warning" 
                  size={20} 
                  color={stockStatus === 'OUT_OF_STOCK' ? '#dc2626' :
                        stockStatus === 'LOW_STOCK' ? '#d97706' : '#059669'} 
                  style={{ marginRight: 8 }}
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: stockStatus === 'OUT_OF_STOCK' ? '#991b1b' :
                        stockStatus === 'LOW_STOCK' ? '#92400e' : '#065f46'
                }}>
                  {stockStatus === 'OUT_OF_STOCK' ? '🔴 Out of Stock' :
                   stockStatus === 'LOW_STOCK' ? '⚠️ Low Stock Alert' :
                   '✅ Restock Inventory'}
                </Text>
              </View>
              <Text style={{
                fontSize: 14,
                color: stockStatus === 'OUT_OF_STOCK' ? '#7f1d1d' :
                      stockStatus === 'LOW_STOCK' ? '#78350f' : '#064e3b'
              }}>
                Current stock: <Text style={{ fontWeight: 'bold' }}>{selectedCurrentStock}</Text> | 
                Reorder level: <Text style={{ fontWeight: 'bold' }}>{selectedReorderLevel}</Text>
              </Text>
            </View>

            {/* Quantity Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.foreground, marginBottom: 12 }}>
                Quantity to Receive
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={quantityToReorder.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setQuantityToReorder(value);
                  }}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: isQuantityExceedingBatch ? '#fef2f2' : colors.background,
                    borderWidth: 2,
                    borderColor: isQuantityExceedingBatch ? '#ef4444' : colors.border,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.foreground,
                    textAlign: 'center'
                  }}
                  placeholder="Enter quantity"
                  placeholderTextColor={colors.mutedForeground}
                />
                <View style={{
                  position: 'absolute',
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center'
                }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 14, fontWeight: '500' }}>
                    units
                  </Text>
                </View>
              </View>
              
              {/* Validation Messages */}
              {isQuantityExceedingBatch && (
                <View style={{
                  backgroundColor: '#fef2f2',
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: '#fecaca'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="warning" size={16} color="#dc2626" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, color: '#991b1b', fontWeight: '500', flex: 1 }}>
                      Cannot receive {quantityToReorder} units. Only {batchStock} available in batch.
                    </Text>
                  </View>
                </View>
              )}
              
              {batchStock !== null && !isQuantityExceedingBatch && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Ionicons name="sparkles" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    You can receive up to <Text style={{ fontWeight: '600', color: colors.primary }}>{batchStock} units</Text> from batch
                  </Text>
                </View>
              )}
            </View>

            {/* Stock After Receiving Preview */}
            <View style={{
              backgroundColor: '#f0fdf4',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 2,
              borderColor: '#bbf7d0'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#065f46' }}>
                  📈 Stock After Receiving
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#059669', marginRight: 8 }}>
                    {selectedCurrentStock + (isQuantityValid ? quantityToReorder : 0)}
                  </Text>
                  <Ionicons name="trending-up" size={20} color="#059669" />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: colors.secondary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: loading ? 0.5 : 1
                }}
              >
                <Text style={{ color: colors.secondaryForeground, fontSize: 16, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReorder}
                disabled={loading || !isQuantityValid}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity: (loading || !isQuantityValid) ? 0.5 : 1
                }}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                      Processing...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                      Receive {quantityToReorder} Units
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Info Note */}
            <Text style={{
              fontSize: 12,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: 16
            }}>
              💡 This will deduct from batch inventory and add to product inventory with full audit trail
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReorderModal;
