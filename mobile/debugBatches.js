import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration (using correct config from your app)
const firebaseConfig = {
  apiKey: "AIzaSyDHkE3k09XUzW1ONjN914fWgAHRPDTtsms",
  authDomain: "monisha-databse.firebaseapp.com",
  projectId: "monisha-databse",
  storageBucket: "monisha-databse.firebasestorage.app",
  messagingSenderId: "10224835048",
  appId: "1:10224835048:web:41ebdf9453a559c97fec5d",
  measurementId: "G-J8J31DHXBZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugBatchStructure() {
  try {
    console.log('🔍 DEBUGGING BATCH INVENTORY STRUCTURE\n');
    console.log('=' .repeat(60));
    
    const batchesRef = collection(db, 'batchInventory');
    const batchesSnapshot = await getDocs(batchesRef);
    
    if (batchesSnapshot.empty) {
      console.log('❌ No batches found');
      return;
    }
    
    console.log(`📊 Found ${batchesSnapshot.size} batches\n`);
    
    batchesSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📦 BATCH ${index + 1}: ${data.name || 'Unnamed'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Type: ${data.type || 'N/A'}`);
      console.log(`   Status: ${data.status || 'N/A'}`);
      console.log(`   Total Quantity: ${data.totalQuantity || 0}`);
      
      // Debug the items structure specifically
      console.log(`   Items Property Type: ${typeof data.items}`);
      console.log(`   Items Is Array: ${Array.isArray(data.items)}`);
      console.log(`   Items Length: ${data.items?.length || 'N/A'}`);
      
      if (data.items) {
        console.log(`   Items Structure:`);
        console.log(JSON.stringify(data.items, null, 4));
        
        if (Array.isArray(data.items) && data.items.length > 0) {
          console.log(`   First Item Structure:`);
          const firstItem = data.items[0];
          console.log(`     - variantType: ${firstItem.variantType || 'N/A'}`);
          console.log(`     - color: ${firstItem.color || 'N/A'}`);
          console.log(`     - price: ${firstItem.price || 'N/A'}`);
          console.log(`     - sizes: ${Array.isArray(firstItem.sizes) ? firstItem.sizes.length + ' sizes' : 'N/A'}`);
          
          if (Array.isArray(firstItem.sizes) && firstItem.sizes.length > 0) {
            console.log(`     - First Size: ${JSON.stringify(firstItem.sizes[0], null, 6)}`);
          }
        }
      } else {
        console.log(`   ❌ Items property is missing or null`);
      }
      
      console.log('   ' + '-'.repeat(50));
      console.log('');
    });
    
    console.log('✅ Batch structure debugging completed!');
    
  } catch (error) {
    console.error('❌ Error debugging batch structure:', error);
  }
}

// Run the debug script
console.log('🚀 Starting Batch Structure Debug...\n');
debugBatchStructure().then(() => {
  console.log('Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('Debug failed:', error);
  process.exit(1);
});
