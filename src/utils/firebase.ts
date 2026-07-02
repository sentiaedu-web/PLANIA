import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider setup for Google OAuth
const provider = new GoogleAuthProvider();

// Request full drive metadata and read scopes
provider.addScope("https://www.googleapis.com/auth/drive.readonly");
provider.addScope("https://www.googleapis.com/auth/drive");

// In-memory token storage (as requested by security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we have a user but no cached token (e.g., page refresh),
        // we will need the user to click sign-in to get a fresh token.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In with popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("No se pudo obtener el token de acceso de Google Drive.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Error en Google Sign-In:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve cached access token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Sign out from Firebase
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
