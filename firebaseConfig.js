import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * PANDUAN KONFIGURASI FIREBASE:
 * 1. Buka https://console.firebase.google.com/
 * 2. Buat proyek baru atau pilih proyek yang sudah ada.
 * 3. Tambahkan aplikasi Web (ikon </>) di dalam proyek Anda.
 * 4. Salin objek firebaseConfig yang diberikan dan tempelkan di bawah ini.
 * 5. Di Firebase Console, masuk ke menu "Authentication" -> "Sign-in method",
 *    lalu aktifkan penyedia "Email/Password".
 */

const firebaseConfig = {
  apiKey: "AIzaSyCXd7H_c3X70ePe8pG5vFRrbdT7HMIjv6A",
  authDomain: "project-mad-750ec.firebaseapp.com",
  projectId: "project-mad-750ec",
  storageBucket: "project-mad-750ec.firebasestorage.app",
  messagingSenderId: "501298126075",
  appId: "1:501298126075:web:2f8ba1af4fb3d64ecee45e",
  measurementId: "G-0WSHJD1F08"
};

// Inisialisasi Firebase App (hindari inisialisasi ulang jika sudah ada)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firebase Auth
const auth = getAuth(app);

// Inisialisasi Cloud Firestore
const db = getFirestore(app);

// Inisialisasi Firebase Storage
const storage = getStorage(app);

export { app, auth, db, storage };

