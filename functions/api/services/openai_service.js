const OpenAI = require("openai");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

require('dotenv').config();

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function retrieve_run(thread_id, run_id) {
  const run = await openai.beta.threads.runs.retrieve(
      thread_id,
      run_id,
  );

  console.log("Run status is: ", run.status);

  // if run's status is "completed" return true
  if (run.status === "completed") return true;
  else return false;
}

function periodicallyCheckRun(thread_id, run_id) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        console.log("Checking run status...");
        const isCompleted = await retrieve_run(thread_id, run_id);

        if (isCompleted) {
          console.log("Run completed!");
          clearInterval(interval);
          resolve();
        }
      } catch (error) {
        console.error("Error checking run status:", error);
        clearInterval(interval);
        reject(error);
      }
    }, 1000); // Check every 1000 milliseconds (1 second)
  });
}

async function check_user_thread(userPhone) {
  console.log("CHECKING WHETHER USER EXISTS");
  const user_doc = await db.collection('Users').doc(userPhone).get();

  if (user_doc.exists) {
    const thread_id = user_doc.data().thread_id;
    console.log("USER EXISTS");
    return thread_id;
  }
  console.log("USER DOESN'T EXIST");
  return null;
}

async function create_user(userPhone, thread_id) {
  console.log("CREATING USER");
  const data = {
    phone_number: userPhone,
    thread_id: thread_id,
  };

  await db.collection('Users').doc(userPhone).set(data);
}

const getOpenAIResponse = async (userPhone, message) => {
  try {
    console.log("Received message from", userPhone, ": ", message);

    let threadId;
    threadId = await check_user_thread(userPhone);

    // Check if the user has an existing chat
    // const chatsRef = db.collection('Chats').doc('ExistingChats');
    // const doc = await chatsRef.get();

    const myAssistant = await openai.beta.assistants.retrieve(
        "asst_miXXdPGRpxaQlQ4QtUCrXWYG",
    );

    if (threadId===null) {
      console.log("USER DOESN'T EXIST, I WANNA CREATE ONE");
      // create a new user with a new thread
      const thread = await openai.beta.threads.create();
      threadId = thread.id;

      await create_user(userPhone, threadId);
    }


    // if (doc.exists && doc.data()[userPhone]) {
    //   // Use the existing thread ID
    //   threadId = doc.data()[userPhone];
    // } else {
    //   // If not, create a new thread
    //   const thread = await openai.beta.threads.create();
    //   threadId = thread.id;

    //   // Update Firestore with the new thread ID
    //   const updateData = {};
    //   updateData[userPhone] = threadId;
    //   await chatsRef.set(updateData, {merge: true});
    // }
    const myThread = await openai.beta.threads.retrieve(threadId);
    // const myThread = await openai.beta.threads.retrieve("thread_m9BGpxeCXf0JWVmLYN1EKwyO");


    await openai.beta.threads.messages.create(
        myThread.id,
        {
          role: "user",
          content: message,
        },
    );

    const run = await openai.beta.threads.runs.create(
        myThread.id,
        {assistant_id: myAssistant.id},
    );

    await periodicallyCheckRun(myThread.id, run.id);

    const messages = await openai.beta.threads.messages.list(
        myThread.id,
    );
    console.log("POTENTIAL RESPONSE IS: ", messages.data[0].content[0].text.value);

    return messages.data[0].content[0].text.value;
  } catch (error) {
    console.error("Error in OpenAI Service:", error);
    throw error;
  }
};

module.exports = {getOpenAIResponse};
