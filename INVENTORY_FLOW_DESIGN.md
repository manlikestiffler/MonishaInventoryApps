# Enhanced Inventory Flow Design

## Current Flow (Working)
```
Batch Inventory (40 grey trousers)
    ↓ Create Product (take 10)
Product Inventory (10 trousers) 
    [Batch: 40-10 = 30 remaining] ✅
```

## New Requirements

### 1. Product-to-Student Deduction
```
Product Inventory (10 size 32 trousers)
    ↓ Allocate to Student (1 trouser)
Product Inventory (9 remaining)
    [Student gets 1, Product: 10-1 = 9] ❌ NOT IMPLEMENTED
```

### 2. Stock Validation
- Cannot allocate uniform to student if product inventory = 0
- Show "Out of Stock" error with reorder suggestion

### 3. Reorder System
Instead of creating duplicate products:
```
Product depleted (0 size 32 trousers)
    ↓ Reorder from Batch (add 5 more)
Product restocked (5 trousers)
    [Batch: 30-5 = 25]
    [Reorder Count: 1]
```

## Data Structure Changes

### Enhanced uniform_variants Schema
```javascript
{
  id: string,
  uniformId: string,
  schoolId: string,
  batchId: string,        // Source batch
  color: string,
  sizes: [
    {
      size: string,
      quantity: number,     // ⭐ CURRENT STOCK in product inventory
      allocated: number,    // ⭐ Total allocated to students
      initialQuantity: number  // Original quantity from batch
    }
  ],
  reorderHistory: [        // ⭐ NEW FIELD
    {
      reorderId: string,
      reorderedBy: string,  // userId
      reorderedByName: string,
      reorderDate: ISO timestamp,
      quantityAdded: number,
      sizeReordered: string,
      batchId: string,
      remainingBatchStock: number
    }
  ],
  totalReorders: number,   // Count of reorders
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Implementation Steps

### Step 1: Add Product Inventory Deduction to LogUniform
```javascript
// When logging uniform to student
async function allocateUniformToStudent(studentId, uniformId, size, quantity) {
  // 1. Check product inventory stock
  const variant = await getVariantStock(uniformId, size);
  if (variant.quantity < quantity) {
    throw new Error('Out of stock. Please reorder from batch.');
  }
  
  // 2. Deduct from product inventory
  await updateProductInventory(uniformId, size, -quantity);
  
  // 3. Log to student
  await updateStudentUniformLog(studentId, logEntry);
}
```

### Step 2: Create Reorder Function
```javascript
async function reorderFromBatch(productId, variantId, size, quantity, userId) {
  // 1. Check batch has stock
  const batch = await getBatch(batchId);
  if (!hasSufficientStock(batch, size, quantity)) {
    throw new Error('Insufficient batch stock');
  }
  
  // 2. Deduct from batch
  await updateBatchInventory(batchId, size, -quantity);
  
  // 3. Add to product inventory
  await updateProductInventory(productId, size, +quantity);
  
  // 4. Add to reorder history
  await addReorderHistory(variantId, {
    reorderedBy: userId,
    quantity,
    size,
    date: new Date()
  });
}
```

### Step 3: UI Components Needed

**Web App:**
- Update LogUniform.jsx to check stock before allocation
- Add "Reorder" button in product management
- Show reorder history modal
- Display current stock levels with color indicators

**Mobile App:**
- Update LogUniformModal to validate stock
- Add reorder functionality to product screens
- Show reorder audit trail

## Audit Trail Benefits
1. **Transparency**: See who reordered and when
2. **Fraud Prevention**: Track excessive reordering
3. **Analytics**: Understand demand patterns
4. **Accountability**: Cannot manipulate data without trace

## Stock Status Indicators
- 🟢 IN_STOCK: Stock > reorderLevel (configurable per size)
- 🟡 LOW_STOCK: Stock <= reorderLevel (triggers alert)
- 🔴 OUT_OF_STOCK: Stock = 0 (blocking, cannot allocate)

## Configurable Reorder Levels ✅ IMPLEMENTED

### Product Inventory Reorder Levels
```javascript
uniform_variants: {
  defaultReorderLevel: 5,  // Default for all sizes if not set individually
  sizes: [
    {
      size: "32",
      quantity: 10,
      reorderLevel: 3  // Custom threshold for this specific size
    }
  ]
}
```

### Batch Inventory Reorder Levels
```javascript
batchInventory: {
  items: [
    {
      sizes: [
        {
          size: "32",
          quantity: 50,
          reorderLevel: 10,      // Minimum stock level
          reorderQuantity: 20    // How much to reorder (default: reorderLevel * 2)
        }
      ]
    }
  ]
}
```

## New Functions Available

### Product Reorder Management
1. **setProductReorderLevel(variantId, size, reorderLevel)** - Set custom threshold per size
2. **setDefaultReorderLevel(variantId, defaultReorderLevel)** - Set default for variant
3. **getLowStockAlerts()** - Get all products below reorder level
4. **getProductStockLevels(uniformId)** - Get stock with reorder info

### Batch Reorder Management
1. **setBatchReorderLevel(batchId, variantType, color, size, reorderLevel, reorderQuantity)** - Configure batch thresholds
2. **getBatchLowStockAlerts()** - Get all batch items below reorder level

### Alert Types
```javascript
{
  alertType: 'LOW_STOCK',     // Quantity <= reorderLevel
  alertType: 'OUT_OF_STOCK'   // Quantity = 0
}
```
