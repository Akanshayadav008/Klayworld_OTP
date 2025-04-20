import { getAuth, RecaptchaVerifier } from "firebase/auth";

export const initializeRecaptcha = (elementId) => {
  const auth = getAuth();
  return new RecaptchaVerifier(auth, elementId, {
    'size': 'invisible',
    'callback': () => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    }
  });
};

export const sendOTP = async (phoneNumber, recaptchaVerifier) => {
  try {
    const auth = getAuth();
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    const confirmationResult = await window.firebase.auth().signInWithPhoneNumber(
      formattedNumber,
      recaptchaVerifier
    );
    
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message };
  }
};

export const verifyOTP = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp);
    return { success: true, result };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message };
  }
}; 