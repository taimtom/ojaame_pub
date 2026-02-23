import { paths } from 'src/routes/paths';

import axios from 'src/utils/axios';

import { STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

// export function jwtDecode(token) {
//   try {
//     if (!token) return null;

//     const parts = token.split('.');
//     if (parts.length < 2) {
//       throw new Error('Invalid token!');
//     }

//     const base64Url = parts[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const decoded = JSON.parse(atob(base64));

//     return decoded;
//   } catch (error) {
//     console.error('Error decoding token:', error);
//     throw error;
//   }
// }

// // ----------------------------------------------------------------------

// export function isValidToken(accessToken) {
//   if (!accessToken) {
//     return false;
//   }

//   try {
//     const decoded = jwtDecode(accessToken);

//     if (!decoded || !('exp' in decoded)) {
//       return false;
//     }

//     const currentTime = Date.now() / 1000;

//     return decoded.exp > currentTime;
//   } catch (error) {
//     console.error('Error during token validation:', error);
//     return false;
//   }
// }

// // ----------------------------------------------------------------------

// export function tokenExpired(exp) {
//   const currentTime = Date.now();
//   const timeLeft = exp * 1000 - currentTime;

//   setTimeout(() => {
//     try {
//       alert('Token expired!');
//       sessionStorage.removeItem(STORAGE_KEY);
//       window.location.href = paths.auth.jwt.signIn;
//     } catch (error) {
//       console.error('Error during token expiration:', error);
//       throw error;
//     }
//   }, timeLeft);
// }

// // ----------------------------------------------------------------------

// export async function setSession(accessToken) {
//   try {
//     if (accessToken) {
//       sessionStorage.setItem(STORAGE_KEY, accessToken);

//       axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

//       const decodedToken = jwtDecode(accessToken); // ~3 days by minimals server

//       if (decodedToken && 'exp' in decodedToken) {
//         tokenExpired(decodedToken.exp);
//       } else {
//         throw new Error('Invalid access token!');
//       }
//     } else {
//       sessionStorage.removeItem(STORAGE_KEY);
//       delete axios.defaults.headers.common.Authorization;
//     }
//   } catch (error) {
//     console.error('Error during set session:', error);
//     throw error;
//   }
// }

// Decode token (only for JWT structure)
export function jwtDecode(token) {
  if (!token || typeof token !== 'string') {
    console.error('Invalid token: not provided or not a string.');
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Token is not a JWT; return null
      console.warn('Token is not a valid JWT structure.');
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    const decoded = JSON.parse(jsonPayload);

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error.message);
    return null;
  }
}

// Check if the token is valid
export function isValidToken(accessToken) {
  if (!accessToken) {
    console.error('Access token is missing.');
    return false;
  }

  const decoded = jwtDecode(accessToken);

  // If token is not a JWT, treat it as valid (no expiration checking)
  if (!decoded) {
    console.warn('Token is not a JWT. Skipping expiration validation.');
    return true;
  }

  if (typeof decoded.exp !== 'number') {
    console.error('Decoded token is missing a valid exp claim.');
    return false;
  }

  const currentTime = Date.now() / 1000;
  return decoded.exp > currentTime;
}

// Handle token expiration
export function tokenExpired(exp) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  setTimeout(() => {
    try {
      alert('Token expired!');
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
      throw error;
    }
  }, timeLeft);
}

// Set the session
export async function setSession(accessToken) {
  try {
    if (accessToken && isValidToken(accessToken)) {
      sessionStorage.setItem(STORAGE_KEY, accessToken);
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken);
      if (decodedToken?.exp) {
        tokenExpired(decodedToken.exp);
      } else {
        console.warn('Access token is valid but missing exp claim.');
      }
    } else {
      console.warn('Invalid or missing access token. Session will be cleared.');
      sessionStorage.removeItem(STORAGE_KEY);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error.message);
    throw error;
  }
}
