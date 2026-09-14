// Alias / compatibilidade para webhook
const skalepayHandler = require('./skalepay-webhook');

exports.handler = async (event, context) => {
  return skalepayHandler.handler(event, context);
};
