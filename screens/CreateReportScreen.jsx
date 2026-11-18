import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { auth } from '../firebaseConfig';
import { addItem } from '../store/dataStore';

const CATEGORIES = [
  'Kartu / Identitas / KTM',
  'Elektronik & Gadget',
  'Kunci Motor / Rumah',
  'Buku & Alat Tulis',
  'Pakaian & Aksesoris',
  'Dompet & Uang',
  'Lain-lain',
];

const SAMPLE_PHOTO_PRESETS = [
  { label: 'Kunci', uri: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=60' },
  { label: 'KTM/Kartu', uri: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=60' },
  { label: 'Dompet', uri: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=60' },
  { label: 'Tumbler', uri: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=60' },
];

export default function CreateReportScreen({ navigation, route }) {
  const user = route.params?.user;

  const [type, setType] = useState('lost'); // 'lost' | 'found'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [loading, setLoading] = useState(false);

  // Fungsi Pilih Gambar dari Galeri
  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.7,
      includeBase64: true,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Gagal Memilih Gambar', response.errorMessage || 'Terjadi kesalahan.');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const uri = asset.base64
          ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setImageUri(uri);
      }
    });
  };

  // Fungsi Ambil Foto dari Kamera
  const handleTakePhoto = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.7,
      includeBase64: true,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Gagal Membuka Kamera', response.errorMessage || 'Izin kamera ditolak.');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const uri = asset.base64
          ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setImageUri(uri);
      }
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !contact.trim()) {
      Alert.alert(
        'Kolom Belum Lengkap',
        'Harap isi Nama Barang, Lokasi di Kampus, dan Kontak.'
      );
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser || user;
      await addItem({
        type,
        title: title.trim(),
        category,
        location: location.trim(),
        contact: contact.trim(),
        currentLocation: type === 'found' ? currentLocation.trim() : '',
        description: description.trim(),
        imageUrl: imageUri || '',
        status: 'active',
        userId: currentUser?.uid || 'user_' + Date.now(),
        userName:
          currentUser?.displayName ||
          currentUser?.email?.split('@')[0] ||
          'Mahasiswa',
        userEmail: currentUser?.email || '',
      });

      Alert.alert(
        'Laporan Berhasil Dipublikasikan',
        'Laporan barang Anda telah berhasil disimpan dan dapat dilihat oleh seluruh warga kampus.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Gagal Menyimpan Laporan',
        error.message || 'Pastikan Cloud Firestore telah diaktifkan di Firebase Console.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.formTitle}>Formulir Laporan Barang</Text>
        <Text style={styles.formSubtitle}>
          Bantu sesama warga kampus menemukan atau mengembalikan barang
        </Text>

        {/* Pilihan Tipe: Hilang vs Ditemukan */}
        <Text style={styles.sectionLabel}>Jenis Laporan *</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'lost' && styles.typeButtonLostActive,
            ]}
            onPress={() => setType('lost')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'lost' && styles.typeButtonTextActive,
              ]}
            >
              🔴 Barang Hilang (Lost)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'found' && styles.typeButtonFoundActive,
            ]}
            onPress={() => setType('found')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'found' && styles.typeButtonTextActive,
              ]}
            >
              🟢 Barang Ditemukan (Found)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nama Barang */}
        <Text style={styles.label}>Nama Barang *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Kunci Motor Honda Vario dengan gantungan biru"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
        />

        {/* Kategori */}
        <Text style={styles.label}>Kategori Barang</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lokasi Kampus */}
        <Text style={styles.label}>
          {type === 'lost' ? 'Perkiraan Lokasi Hilang *' : 'Lokasi Ditemukan di Kampus *'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Gedung Kuliah 2 Lantai 3, Depan Lab Komputer"
          placeholderTextColor="#9ca3af"
          value={location}
          onChangeText={setLocation}
        />

        {/* Lokasi Penyimpanan (jika ditemukan) */}
        {type === 'found' ? (
          <>
            <Text style={styles.label}>Posisi Barang Saat Ini (Tempat Pengambilan)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Dititipkan di Pos Satpam Gerbang Utama"
              placeholderTextColor="#9ca3af"
              value={currentLocation}
              onChangeText={setCurrentLocation}
            />
          </>
        ) : null}

        {/* Kontak */}
        <Text style={styles.label}>Nomor WhatsApp / Kontak Pelapor *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 081234567890"
          placeholderTextColor="#9ca3af"
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
        />

        {/* Foto Barang (Fitur 5) */}
        <Text style={styles.label}>Foto Barang (Fitur 5)</Text>
        <View style={styles.uploadCard}>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImageUri('')}
              >
                <Text style={styles.removeImageText}>✕ Hapus Foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadPlaceholderIcon}>📷</Text>
              <Text style={styles.uploadPlaceholderText}>
                Belum ada foto yang dipilih
              </Text>
            </View>
          )}

          <View style={styles.uploadActionsRow}>
            <TouchableOpacity
              style={styles.uploadActionBtn}
              onPress={handlePickImage}
            >
              <Text style={styles.uploadActionBtnText}>🖼️ Galeri HP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadActionBtn}
              onPress={handleTakePhoto}
            >
              <Text style={styles.uploadActionBtnText}>📸 Kamera</Text>
            </TouchableOpacity>
          </View>

          {/* Preset Foto */}
          <View style={styles.presetSection}>
            <Text style={styles.presetLabel}>Atau pilih contoh foto:</Text>
            <View style={styles.presetRow}>
              {SAMPLE_PHOTO_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={styles.presetBtn}
                  onPress={() => setImageUri(p.uri)}
                >
                  <Text style={styles.presetBtnText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Deskripsi */}
        <Text style={styles.label}>Deskripsi & Ciri-Ciri Khusus</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tuliskan warna, merek, nomor seri, isi, stiker, atau detail lainnya..."
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Tombol Simpan */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color="#1e40af" />
              <Text style={styles.loadingText}>Mengirim laporan...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              {type === 'lost' ? '📢 Publikasikan Laporan Hilang' : '📢 Publikasikan Barang Temuan'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  typeButtonLostActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  typeButtonFoundActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  typeButtonTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    marginBottom: 14,
  },
  textArea: {
    minHeight: 90,
  },
  categoryScroll: {
    marginBottom: 14,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  removeImageText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadPlaceholder: {
    height: 100,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  uploadPlaceholderIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  uploadPlaceholderText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  uploadActionBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  presetSection: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  presetLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetBtnText: {
    fontSize: 11,
    color: '#334155',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '700',
  },
});
