const admin = require('firebase-admin');
const serviceAccount = require('./firebase_key.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const salesRef = db.collection('Shopify Stores').doc("21stitches-co-8829.myshopify.com").collection('Sales');

async function addRefundedField() {
  const querySnapshot = await salesRef.get();

  let batch = db.batch();
  let count = 0;
  querySnapshot.forEach((doc) => {
    if (doc.data().refunded === undefined) { // Check if 'refunded' field is missing
      const docRef = salesRef.doc(doc.id);
      batch.update(docRef, { 'refunded': false });
      count++;

      if (count % 500 === 0) { // Commit each batch of 500 updates
        batch.commit();
        batch = db.batch(); // Start a new batch
      }
    }
  });

  if (count % 500 !== 0) { // Commit the last batch if it has less than 500 updates
    await batch.commit();
  }

  console.log(`Updated ${count} documents.`);
}

addRefundedField().catch(console.error);
