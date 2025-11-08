import { create } from 'zustand';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNotificationStore } from './notificationStore';

// Real data structure matches Firestore batchInventory collection
// Sample structure:
// {
//   name: 'shirtsBatch',
//   type: 'shirts',
//   status: 'active',
//   totalQuantity: 10,
//   totalValue: 100,
//   items: [{ color: 'white', price: 10, variantType: 'short sleeve', sizes: [...] }],
//   createdBy: 'tinashegomo96@gmail.com',
//   createdByUid: 'clWosYyfcBWfgWWm7BexoiIAIa73',
//   createdByRole: 'staff',
//   createdAt: Timestamp,
//   updatedAt: Timestamp
// }

export const useBatchStore = create((set, get) => ({
  batches: [],
  loading: false,
  error: null,
  unsubscribe: null,

  // Real-time batch synchronization
  subscribeToAllBatches: () => {
    try {
      // Clean up any existing subscription first
      const currentState = get();
      if (currentState.unsubscribe) {
        currentState.unsubscribe();
      }

      const batchesRef = collection(db, 'batchInventory');
      const q = query(batchesRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const batchesData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id, // Must come AFTER spread to overwrite any local id field
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        set({ batches: batchesData, loading: false, error: null });
      }, (error) => {
        console.error('Error in batch subscription:', error);
        set({ error: error.message, loading: false });
      });

      set({ unsubscribe });
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up batch subscription:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Stop real-time synchronization
  unsubscribeFromBatches: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },

  fetchBatches: () => {
    // Use the real-time subscription to fetch and sync batches
    return get().subscribeToAllBatches();
  },

  getBatch: async (id) => {
    try {
      const batchDoc = await getDoc(doc(db, 'batchInventory', id));
      if (batchDoc.exists()) {
        const data = batchDoc.data();
        return { 
          ...data,
          id: batchDoc.id, // Must come AFTER spread to overwrite any local id field
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting batch:', error);
      throw error;
    }
  },

  subscribeToBatch: (id, callback) => {
    const batchRef = doc(db, 'batchInventory', id);
    const unsubscribe = onSnapshot(batchRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({ 
          ...data,
          id: doc.id, // Must come AFTER spread to overwrite any local id field
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
        });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Error subscribing to batch:", error);
      callback(null);
    });
    return unsubscribe;
  },

  addBatch: async (batch, userInfo) => {
    try {
      // Add to Firebase - real-time subscription will automatically update state
      const docRef = await addDoc(collection(db, 'batchInventory'), {
        ...batch,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create notification with user info
      const notificationStore = useNotificationStore.getState();
      notificationStore.createBatchNotification(
        batch.name,
        batch.items?.length || 0,
        userInfo
      );
      
      // Return the new batch info without manually updating state
      // The real-time subscription will handle the state update
      return {
        id: docRef.id,
        ...batch,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding batch:', error);
      throw error;
    }
  },

  updateBatch: async (id, data) => {
    try {
      const batchRef = doc(db, 'batchInventory', id);
      await updateDoc(batchRef, {
        ...data,
        updatedAt: new Date()
      });
      // Real-time subscription will handle state update
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  },

  deleteBatch: async (id, userInfo) => {
    try {
      // Get batch info before deletion for notification
      const batchDoc = await getDoc(doc(db, 'batchInventory', id));
      const batchData = batchDoc.exists() ? batchDoc.data() : null;
      
      // Delete from Firebase - real-time subscription will update state
      await deleteDoc(doc(db, 'batchInventory', id));
      
      // Create deletion notification with user info
      if (batchData && userInfo) {
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          type: 'batch_deleted',
          title: 'Batch Deleted',
          message: `Batch "${batchData.name}" has been deleted`,
          category: 'inventory',
          priority: 'medium',
          icon: '🗑️'
        }, userInfo);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  },

  updateBatchStatus: async (id, status) => {
    try {
      const batchRef = doc(db, 'batchInventory', id);
      await updateDoc(batchRef, {
        status,
        updatedAt: new Date()
      });
      // Real-time subscription will handle state update
      return { id, status, updatedAt: new Date() };
    } catch (error) {
      console.error('Error updating batch status:', error);
      throw error;
    }
  },

  getBatchesBySchool: (schoolId) => {
    const state = get();
    return state.batches.filter(b => b.schoolId === schoolId);
  },

  getBatchesByStatus: (status) => {
    const state = get();
    return state.batches.filter(b => b.status === status);
  }
})); 