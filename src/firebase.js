import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "***REMOVED***",
  authDomain: "***REMOVED***",
  projectId: "***REMOVED***",
  storageBucket: "***REMOVED***.firebasestorage.app",
  messagingSenderId: "***REMOVED***",
  appId: "1:***REMOVED***:web:edd5db7cb6631ac598b8c8",
  measurementId: "***REMOVED***"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Set authentication persistence to local, with fallback to session
try {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Firebase persistence set to local');
    })
    .catch((error) => {
      console.error('Error setting local persistence:', error.code, error.message);
      // Fallback to session persistence
      return setPersistence(auth, browserSessionPersistence)
        .then(() => console.log('Fallback: Firebase persistence set to session'))
        .catch((fallbackError) => console.error('Error setting session persistence:', fallbackError.code, fallbackError.message));
    });
} catch (error) {
  console.error('Synchronous error in setPersistence:', error);
}

export { auth, googleProvider, githubProvider, db, analytics };