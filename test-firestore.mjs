import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

signInWithEmailAndPassword(auth, 'firozahmedskt1@gmail.com', 'testpassword').then(async (cred) => {
  console.log('Logged in as', cred.user.uid);
  try {
    const docRef = await addDoc(collection(db, 'thesisChapters'), {
      title: 'Test',
      bullets: 'Test',
      status: 'Draft',
      draftContent: 'Test',
      userId: cred.user.uid,
      createdAt: new Date().toISOString()
    });
    console.log('Added', docRef.id);
    
    await updateDoc(doc(db, 'thesisChapters', docRef.id), {
      title: 'Updated',
      bullets: 'Test',
      status: 'Draft',
      draftContent: 'Test',
      userId: cred.user.uid
    });
    console.log('Updated');
  } catch (err) {
    console.error(err);
  }
}).catch(err => console.error('Auth error', err));
