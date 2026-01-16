const axios = require('axios');

const BULKSMS_API_URL = 'https://api.bulksms.com/v1/messages';

/**
 * Send SMS via BulkSMS.com API
 * @param {string} phoneNumber - 10-digit phone number (will be prefixed with country code)
 * @param {string} message - SMS message content
 * @returns {Promise<object>} - API response
 */
async function sendSMS(phoneNumber, message) {
  const tokenId = process.env.BULKSMS_TOKEN_ID;
  const tokenSecret = process.env.BULKSMS_TOKEN_SECRET;
  const senderId = process.env.BULKSMS_SENDER_ID || 'HireMeFor';

  // Development mode: log to console instead of sending
  if (!tokenId || !tokenSecret || tokenId === 'your_token_id_here') {
    console.log('\n========================================');
    console.log('  SMS (Development Mode - Not Sent)');
    console.log('========================================');
    console.log(`  To: ${phoneNumber}`);
    console.log(`  Message: ${message}`);
    console.log('========================================\n');
    return { success: true, development: true };
  }

  // Format phone number with South Africa country code
  const formattedPhone = phoneNumber.startsWith('27')
    ? phoneNumber
    : `27${phoneNumber.replace(/^0/, '')}`;

  try {
    const response = await axios.post(
      BULKSMS_API_URL,
      {
        to: formattedPhone,
        body: message,
        from: senderId
      },
      {
        auth: {
          username: tokenId,
          password: tokenSecret
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`SMS sent to ${formattedPhone}: ${message.substring(0, 30)}...`);
    return response.data;
  } catch (error) {
    console.error('BulkSMS API error:', error.response?.data || error.message);
    throw new Error('Failed to send SMS');
  }
}

/**
 * Generate a 6-digit OTP code
 * @returns {string} - 6-digit OTP code
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Phone number to send OTP to
 * @param {string} otpCode - The OTP code to send
 * @param {string} purpose - 'registration' or 'pin_reset'
 */
async function sendOTP(phoneNumber, otpCode, purpose) {
  const messages = {
    registration: `Your Hire Me For registration code is: ${otpCode}. Valid for 60 minutes.`,
    pin_reset: `Your Hire Me For PIN reset code is: ${otpCode}. Valid for 60 minutes.`
  };

  const message = messages[purpose] || messages.registration;
  return sendSMS(phoneNumber, message);
}

module.exports = {
  sendSMS,
  sendOTP,
  generateOTP
};
