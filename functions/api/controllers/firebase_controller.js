const firebase_service = require('../services/firebase_service');

const postFirebaseUpdateMessageTemplate = async (req, res) => {
  try {
    // Required parameters
    const message_type = req.body.type;
    const shopDomain = req.body.shop;
    const messageContent = req.body.message;
    if (!messageContent || !message_type || !shopDomain) {
      res.status(400).send('Missing required parameters');
    }

    await firebase_service.update_message_template(shopDomain, message_type, messageContent);

    res.status(200).send('Message template successfully updated');
  } catch (error) {
    console.error("Error in postFirebaseUpdateMessageTemplate:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postFirebaseGetMessageTemplate = async (req, res) => {
  try {
    // Required parameters
    const message_type = req.body.type;
    const shopDomain = req.body.shop;
    if (!message_type || !shopDomain) {
      res.status(400).send('Missing required parameters');
    }

    const message_template = await firebase_service.get_message_template(shopDomain, message_type);

    res.status(200).send(message_template);
  } catch (error) {
    console.error("Error in postFirebaseGetMessageTemplate:", error);
    res.status(500).send('Internal Server Error');
  }
};

const postSetNewCart = async (req, res) => {
  try {
    // Required parameters
    const cart = req.body.cart;
    const shopDomain = req.body.shop;
    if (!cart || !shopDomain) {
      res.status(400).send('Missing required parameters');
    }

    await firebase_service.update_cart(shopDomain, cart);


    res.status(200).json({message: 'Success'});
  } catch (error) {
    console.error("Error in postSetNewCart:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {postFirebaseUpdateMessageTemplate, postFirebaseGetMessageTemplate, postSetNewCart};
