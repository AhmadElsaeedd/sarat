const firebase_service = require('../services/firebase_service');
const OpenAI = require("openai");

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
        const isCompleted = await retrieve_run(thread_id, run_id);

        if (isCompleted) {
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

async function getOpenAIResponse(userPhone, message) {
  try {
    let threadId;
    threadId = await firebase_service.check_user_thread(userPhone);

    const myAssistant = await openai.beta.assistants.retrieve(
        "asst_oUlU2A4DdEbUVFFKRzgpF2Xt",
    );

    if (threadId===null) {
      // create a new user with a new thread
      const thread = await openai.beta.threads.create();
      threadId = thread.id;

      await firebase_service.create_user(userPhone, threadId);
    }

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

    return messages.data[0].content[0].text.value;
  } catch (error) {
    console.error("Error in OpenAI Service:", error);
    throw error;
  }
}

module.exports = {getOpenAIResponse};
