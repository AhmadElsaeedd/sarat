const admin = require('firebase-admin');
const serviceAccount = require('./firebase_key.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Define your document data
const documentData1 = {
  cart_value: [100, 300],
    cohort_id: "Pre-defined 1",
    cohort_type: "Pre-defined",
    cohort_number: 1,
    date_created: admin.firestore.FieldValue.serverTimestamp(),
    discount_amount_in_first: 0,
    discount_amount_in_second: 10,
    discount_in_first: false,
    discount_in_second: true,
    discount_message1: "I can give you a {discountAmount}% discount if you complete your purchase now.",
    discount_message2: "I can give you a {discountAmount}% discount if you complete your purchase now.",
    first_reminder_active: true,
    first_reminder_time: 1,
    items_in_cart: false,
    message_close1: "Just text \"Yes\" and I'll send you a checkout link!",
    message_close2: "Just text \"Yes\" and I'll send you a checkout link!",
    message_opener1: "Hey {personName}, I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
    message_opener2: "Hey {personName}, I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
    product_list1: "{productName} for {productPrice}",
    product_list2: "{productName} for {productPrice}",
    purchase_frequency: ["first_time", "returning"],
    second_reminder_active: true,
    second_reminder_time: 6,
};

const documentData2 = {
  cart_value: [300, 0],
    cohort_id: "Pre-defined 2",
    cohort_type: "Pre-defined",
    cohort_number: 2,
    date_created: admin.firestore.FieldValue.serverTimestamp(),
    discount_amount_in_first: 0,
    discount_amount_in_second: 15,
    discount_in_first: false,
    discount_in_second: true,
    discount_message1: "I can give you a {discountAmount}% discount if you complete your purchase now.",
    discount_message2: "I can give you a {discountAmount}% discount if you complete your purchase now.",
    first_reminder_active: true,
    first_reminder_time: 2,
    items_in_cart: false,
    message_close1: "Just text \"Yes\" and I'll send you a checkout link!",
    message_close2: "Just text \"Yes\" and I'll send you a checkout link!",
    message_opener1: "Hey {personName}, I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
    message_opener2: "Hey {personName}, I am {humanName} from {brandName}. I noticed that you left your cart without checking out. I can help you checkout here easily and quickly! Your cart contained:",
    product_list1: "{productName} for {productPrice}",
    product_list2: "{productName} for {productPrice}",
    purchase_frequency: ["first_time"],
    second_reminder_active: true,
    second_reminder_time: 8,
};

// Specify the collection and sub-collection path
const collectionPath = 'Shopify Stores';
const subCollectionPath = 'Cohorts';

// Add the document to the sub-collection
db.collection(collectionPath).doc('21stitches-co-8829.myshopify.com').collection(subCollectionPath)
  .doc("Pre-defined 1").set(documentData1)
  .then((docRef) => {
    console.log(`Document written with ID: ${docRef.id}`);
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
  });

  db.collection(collectionPath).doc('21stitches-co-8829.myshopify.com').collection(subCollectionPath)
  .doc("Pre-defined 2").set(documentData2)
  .then((docRef) => {
    console.log(`Document written with ID: ${docRef.id}`);
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
  });
