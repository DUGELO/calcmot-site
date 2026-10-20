/** Narrow SDK boundary keeps unused Firebase products and sign-in methods out of the route. */
export { initializeApp, getApps } from "firebase/app";
export {
  initializeAuth,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  signOut,
} from "firebase/auth";
