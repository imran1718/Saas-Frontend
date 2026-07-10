/**
 * SMS/WhatsApp Service stub.
 * TODO: To be fully implemented in Module 13 (Notifications/Communications)
 */

const sendSMS = async ({ to, message }) => {
  // eslint-disable-next-line no-console
  console.log(`[SMSService Stub] Would send SMS to ${to}: ${message}`);
  return true;
};

module.exports = {
  sendSMS,
};
