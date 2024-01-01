const getShopify = (req, res) => {

};

const postShopify = async (req, res) => {
  try {
    // We can make this post endpoint with only 1 required parameter, specifiying the type of request to make to shopify

    // Then some optional parameters to specify what we need from the endpoint in shopify, exactly the query maybe

    // Then in the service code, we could make the api requests from shopofy with the parameters

    // Then, return the results of this post request in the database

    res.status(200).send('EVENT RECEIVED');
  } catch (error) {
    console.error("Error in postShopify:", error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {getShopify, postShopify};
