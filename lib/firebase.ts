import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCUG6D03J_r0soi863SJ8lPVAog87H--I",
  authDomain: "run-tracker-c41fc.firebaseapp.com",
  projectId: "run-tracker-c41fc",
  storageBucket: "run-tracker-c41fc.appspot.com",
  messagingSenderId: "420755091978",
  appId: "1:420755091978:web:c1a6fe86605cd3193c25f3",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Firestore database
export const db = getFirestore(app)