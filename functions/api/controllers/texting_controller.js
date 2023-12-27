const {sendIntroMessage} = require('../services/whatsapp_service');

const postTexting = async (req, res) => {
  try {
    // Required parameters
    const productName = req.body.productName;
    const phoneNumber = req.body.phoneNumber;
    if (!productName || !phoneNumber) {
      res.status(400).send('Missing required parameters');
    }
    // Optional parameters
    const personName = req.body.personName || null;
    const productSize = req.body.productSize || null;
    console.log("Person name is: ", personName);
    console.log("Product size is: ", productSize);
    // Call sendIntroMessage
    await sendIntroMessage(phoneNumber, productName, personName, productSize);

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postTexting:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {postTexting};
