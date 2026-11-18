import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

// Data awal standar kampus
const INITIAL_ITEMS = [
  {
    id: 'sample-1',
    type: 'lost',
    title: 'Kunci Motor Honda Beat Hitam',
    category: 'Kunci Motor / Rumah',
    location: 'Parkiran Gedung Kuliah Utama (GK1)',
    currentLocation: '',
    contact: '081234567890',
    description: 'Ada gantungan kunci berbentuk boneka rajut cokelat dan logo kampus.',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=60',
    status: 'active',
    userId: 'default-user-1',
    userName: 'Budi Santoso',
    userEmail: 'budi@unklab.ac.id',
    localDateString: 'Hari ini',
    createdAtMillis: Date.now() - 3600000 * 2,
    comments: [
      {
        id: 'c-1',
        text: 'Apakah kuncinya ada gantungan warna biru?',
        userId: 'default-user-2',
        userName: 'Siti Aminah',
        userEmail: 'siti@unklab.ac.id',
        dateString: '1 jam lalu',
      },
    ],
  },
  {
    id: 'sample-2',
    type: 'found',
    title: 'Kartu Tanda Mahasiswa (KTM) BNI',
    category: 'Kartu / Identitas / KTM',
    location: 'Meja 12 Kantin Pusat',
    currentLocation: 'Dititipkan di Pos Satpam Utama',
    contact: '089876543210',
    description: 'KTM atas nama Rina S. Ditemukan setelah jam istirahat siang.',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=60',
    status: 'active',
    userId: 'default-user-2',
    userName: 'Siti Aminah',
    userEmail: 'siti@unklab.ac.id',
    localDateString: 'Kemarin',
    createdAtMillis: Date.now() - 3600000 * 24,
    comments: [],
  },
  {
    id: 'sample-3',
    type: 'lost',
    title: 'Tumbler Corkcicle Warna Sage Green',
    category: 'Lain-lain',
    location: 'Perpustakaan Lantai 2',
    currentLocation: '',
    contact: '081398761234',
    description: 'Tertinggal di sofa membaca. Ada stiker kucing di tutupnya.',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=60',
    status: 'resolved',
    userId: 'default-user-3',
    userName: 'Daniel',
    userEmail: 'daniel@unklab.ac.id',
    localDateString: '3 hari lalu',
    createdAtMillis: Date.now() - 3600000 * 72,
    comments: [],
  },
];

// Penyimpanan data persisten dalam memori JavaScript runtime (bertahan selama aplikasi berjalan)
let memoryItems = [...INITIAL_ITEMS];
const listeners = new Set();
const commentListeners = new Map(); // itemId -> Set of callbacks

function notifyListeners() {
  const currentList = [...memoryItems];
  listeners.forEach((callback) => {
    try {
      callback(currentList);
    } catch (e) {
      console.warn('Listener callback error:', e);
    }
  });
}

function notifyCommentListeners(itemId) {
  const item = memoryItems.find((i) => i.id === itemId);
  const comments = item && item.comments ? [...item.comments] : [];
  const subs = commentListeners.get(itemId);
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb(comments);
      } catch (e) {
        console.warn('Comment listener callback error:', e);
      }
    });
  }
}

// Inisialisasi sinkronisasi Firestore jika tersedia
let isFirestoreSynced = false;
export function initFirestoreSync() {
  if (isFirestoreSynced) return;
  isFirestoreSynced = true;

  try {
    const colRef = collection(db, 'lost_and_found');
    onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudItems = [];
          snapshot.forEach((docSnap) => {
            cloudItems.push({ id: docSnap.id, ...docSnap.data() });
          });

          // Gabungkan item dari Firestore dengan item lokal tanpa menghilangkan laporan baru
          const merged = [...cloudItems];
          memoryItems.forEach((localItem) => {
            if (!merged.some((m) => m.id === localItem.id)) {
              merged.push(localItem);
            }
          });

          // Urutkan berdasarkan waktu terbaru
          merged.sort(
            (a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0)
          );
          memoryItems = merged;
          notifyListeners();
        }
      },
      (error) => {
        // Jika Firestore belum diaktifkan di Firebase Console, gunakan penyimpanan persisten lokal
        console.warn('Firestore offline/permission fallback:', error.message);
      }
    );
  } catch (err) {
    console.warn('Init Firestore sync error:', err.message);
  }
}

// Berlangganan perubahan data barang
export function subscribeItems(callback) {
  listeners.add(callback);
  callback([...memoryItems]);
  initFirestoreSync();

  return () => {
    listeners.delete(callback);
  };
}

// Berlangganan perubahan komentar pada suatu barang
export function subscribeComments(itemId, callback) {
  if (!commentListeners.has(itemId)) {
    commentListeners.set(itemId, new Set());
  }
  const subs = commentListeners.get(itemId);
  subs.add(callback);

  const item = memoryItems.find((i) => i.id === itemId);
  callback(item && item.comments ? [...item.comments] : []);

  // Sinkronisasi subcollection Firestore jika tersedia
  let unsubFirestore = () => {};
  try {
    const commentsCol = collection(db, 'lost_and_found', itemId, 'comments');
    unsubFirestore = onSnapshot(
      commentsCol,
      (snap) => {
        if (!snap.empty) {
          const cloudComments = [];
          snap.forEach((d) => {
            cloudComments.push({ id: d.id, ...d.data() });
          });
          if (item) {
            item.comments = cloudComments;
            notifyCommentListeners(itemId);
          }
        }
      },
      () => {}
    );
  } catch (e) {
    // Abaikan jika Firestore offline
  }

  return () => {
    subs.delete(callback);
    unsubFirestore();
  };
}

// Ambil seluruh item saat ini
export function getAllItems() {
  return [...memoryItems];
}

// Tambah laporan barang baru
export async function addItem(itemData) {
  const currentUser = auth.currentUser;
  const newId = 'report_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

  const newItem = {
    ...itemData,
    id: newId,
    userId: currentUser?.uid || itemData.userId || 'anonymous',
    userName:
      currentUser?.displayName ||
      currentUser?.email?.split('@')[0] ||
      itemData.userName ||
      'Mahasiswa',
    userEmail: currentUser?.email || itemData.userEmail || '',
    status: itemData.status || 'active',
    comments: [],
    createdAtMillis: Date.now(),
    localDateString: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  };

  // Simpan secara lokal segera agar langsung terlihat
  memoryItems = [newItem, ...memoryItems];
  notifyListeners();

  // Simpan ke Firestore
  try {
    const docRef = await addDoc(collection(db, 'lost_and_found'), {
      ...newItem,
      createdAt: serverTimestamp(),
    });
    newItem.firestoreId = docRef.id;
  } catch (error) {
    console.warn('Simpan ke Firestore tertunda (mode lokal aktif):', error.message);
  }

  return newItem;
}

// Perbarui laporan barang
export async function updateItem(itemId, updatedFields) {
  const index = memoryItems.findIndex((i) => i.id === itemId);
  if (index !== -1) {
    memoryItems[index] = { ...memoryItems[index], ...updatedFields };
    notifyListeners();
  }

  try {
    await updateDoc(doc(db, 'lost_and_found', itemId), updatedFields);
  } catch (error) {
    console.warn('Update Firestore tertunda:', error.message);
  }
}

// Hapus laporan barang
export async function deleteItem(itemId) {
  memoryItems = memoryItems.filter((i) => i.id !== itemId);
  notifyListeners();

  try {
    await deleteDoc(doc(db, 'lost_and_found', itemId));
  } catch (error) {
    console.warn('Delete Firestore tertunda:', error.message);
  }
}

// Tambah komentar pada barang
export async function addComment(itemId, commentText) {
  const currentUser = auth.currentUser;
  const commentId = 'com_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

  const newComment = {
    id: commentId,
    itemId,
    text: commentText.trim(),
    userId: currentUser?.uid || 'anon',
    userName:
      currentUser?.displayName ||
      currentUser?.email?.split('@')[0] ||
      'Mahasiswa',
    userEmail: currentUser?.email || '',
    createdAtMillis: Date.now(),
    dateString:
      new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      }) +
      ' ' +
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
  };

  // Perbarui item lokal
  const item = memoryItems.find((i) => i.id === itemId);
  if (item) {
    if (!item.comments) item.comments = [];
    item.comments = [...item.comments, newComment];
    notifyCommentListeners(itemId);
    notifyListeners();
  }

  // Simpan ke Firestore subcollection
  try {
    await addDoc(
      collection(db, 'lost_and_found', itemId, 'comments'),
      {
        ...newComment,
        createdAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.warn('Simpan komentar ke Firestore tertunda:', error.message);
  }

  return newComment;
}
