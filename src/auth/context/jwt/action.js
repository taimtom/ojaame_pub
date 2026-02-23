import axios, { endpoints } from 'src/utils/axios';

import { setSession } from './utils';
import { STORAGE_KEY } from './constant';

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    setSession(accessToken);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Google signup/Signin
 *************************************** */
// Add this new action
export const signInWithGoogle = async (idToken) => {
  try {
    const res = await axios.post(endpoints.auth.googleAuth, { id_token: idToken });

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }
    sessionStorage.setItem(STORAGE_KEY, accessToken);
    setSession(accessToken);
    return accessToken;
  } catch (error) {
    console.error('Error during Google sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({
  email,
  password,
  re_password,
  firstName,
  lastName,
  phoneNumber,
}) => {
  const params = {
    email,
    password,
    re_password,
    firstName,
    lastName,
    phoneNumber,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    sessionStorage.setItem(STORAGE_KEY, accessToken);
  } catch (error) {
    console.error('Error during sign up:', error);
    // Check if the error response includes a "detail" property.
    if (error.response && error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};


/** **************************************
 * Verify Email
 *************************************** */
export const verifyEmail = async ({ code }) => {
  const params = { code };
  try {
    const res = await axios.post(endpoints.auth.verifyEmail, params);
    if (res.status !== 200) {
      throw new Error('Email verification failed');
    }
    return res.data; // Return any useful data if needed
  } catch (error) {
    console.error('Error during email verification:', error);
    throw error;
  }
};


/** **************************************
 * Resend Verification
 *************************************** */
export const resendVerification = async () => {
  try {
    const res = await axios.post(endpoints.auth.resendVerification);
    return res.data;
  } catch (error) {
    console.error("Error resending verification:", error);
    throw error;
  }
};


/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

/** **************************************
 * Send Reset OTP
 *************************************** */
export const sendResetOtp = async ({ email }) => {
  try {
    const res = await axios.post(endpoints.auth.sendResetOtp, { email });
    return res.data;
  } catch (error) {
    console.error('Error sending reset OTP:', error);
    throw error;
  }
}
/** **************************************
 * Reset Password
 *************************************** */
export const resetPassword = async ({ email, code, new_password, re_password}) => {
  try {
    // Validate the input parameters
    if (!email || !code || !new_password) {
      throw new Error('All fields are required');
    }
    if (new_password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(new_password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(new_password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(new_password)) {
      throw new Error('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(new_password)) {
      throw new Error('Password must contain at least one special character');
    }
    if (code.length < 6) {
      throw new Error('Code must be at least 6 characters long');
    }
    // If all validations pass, proceed with the API call
    const params = {
    email,
    otp: Number(code),          // ensure it’s numeric if your backend stores it as int
    new_password,
    re_password,
    };
    // console.log('Reset Password Params:', params);
    // console.log('Reset Password Endpoint:', endpoints.auth.resetPassword);
    // console.log('Reset Password URL:', endpoints.auth.resetPassword);
    // const res = await axiosInstance.patch(endpoints.auth.resetPassword, payload);
    const res = await axios.post(endpoints.auth.resetPassword, params);
    if (res.status !== 200) {
      throw new Error('Password reset failed');
    }
    return res.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}
/** **************************************
 * Update Password
 *************************************** */
// export const updatePassword = async ({ old_password, new_password }) => {
//   try {
//     const res = await axios.post(endpoints.auth.updatePassword, { old_password, new_password });
//     return res.data;
//   } catch (error) {
//     console.error('Error updating password:', error);
//     throw error;
//   }
// }
