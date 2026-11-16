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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { db } from '../firebaseConfig';

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
  { label: 'Dompet', uri: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=60' },
  { label: 'Laptop', uri: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60' },
  { label: 'Tumbler', uri: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=60' },
];

export default function ReportLostScreen({ navigation, route }) {
  const user = route.params?.user;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [dateLost, setDateLost] = useState('Hari ini');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
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
        Alert.alert('Gagal Membuka Kamera', response.errorMessage || 'Izin kamera ditolak atau kamera tidak tersedia.');
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

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setImageUri(customUrl.trim());
    setShowUrlInput(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !contact.trim()) {
      Alert.alert(
        'Kolom Belum Lengkap',
        'Harap isi Nama Barang, Perkiraan Lokasi Hilang, dan Nomor Kontak.'
      );
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'lost_and_found'), {
        type: 'lost',
        title: title.trim(),
        category,
        location: location.trim(),
        dateIncident: dateLost.trim(),
        contact: contact.trim(),
        description: description.trim(),
        imageUrl: imageUri || '',
        status: 'active', // 'active' (belum ditemukan) atau 'resolved' (sudah ditemukan)
        userId: user?.uid || 'anonymous',
        userName: user?.displayName || user?.email?.split('@')[0] || 'Mahasiswa',
        userEmail: user?.email || '',
        createdAt: serverTimestamp(),
        localDateString: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      });

      Alert.alert('Laporan berhasil dikirim', 'Laporan barang hilang Anda sudah berhasil dilaporkan.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Gagal Mengirim Laporan', error.message);
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
        {/* Banner Penjelasan */}
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>📢</Text>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Lapor Barang Hilang (Lost)</Text>
            <Text style={styles.bannerDesc}>
              Isi data selengkap mungkin agar warga kampus yang menemukan dapat menghubungi Anda.
            </Text>
          </View>
        </View>

        {/* Nama Barang */}
        <Text style={styles.label}>Nama Barang yang Hilang *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Kunci Motor Beat dengan gantungan boneka rajut"
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

        {/* Lokasi Hilang */}
        <Text style={styles.label}>Perkiraan Lokasi Hilang di Kampus *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Gedung Kuliah 2 Lantai 3, Depan Lab Jaringan"
          placeholderTextColor="#9ca3af"
          value={location}
          onChangeText={setLocation}
        />

        {/* Waktu Hilang */}
        <Text style={styles.label}>Waktu / Tanggal Hilang</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Hari ini sekitar pukul 11:30"
          placeholderTextColor="#9ca3af"
          value={dateLost}
          onChangeText={setDateLost}
        />

        {/* Kontak */}
        <Text style={styles.label}>Nomor WhatsApp / HP Pelapor *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 081234567890"
          placeholderTextColor="#9ca3af"
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
        />

        {/* Upload Foto Barang */}
        <Text style={styles.label}>Foto Barang (Sangat Dianjurkan)</Text>
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

            <TouchableOpacity
              style={[styles.uploadActionBtn, styles.uploadActionBtnSecondary]}
              onPress={() => setShowUrlInput(!showUrlInput)}
            >
              <Text style={styles.uploadActionBtnTextSecondary}>🌐 URL Foto</Text>
            </TouchableOpacity>
          </View>

          {/* Preset Foto Cepat */}
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

          {/* Input URL Foto Kustom */}
          {showUrlInput ? (
            <View style={styles.urlInputBox}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://contoh.com/foto.jpg"
                placeholderTextColor="#9ca3af"
                value={customUrl}
                onChangeText={setCustomUrl}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.urlSubmitBtn}
                onPress={handleApplyCustomUrl}
              >
                <Text style={styles.urlSubmitBtnText}>Terapkan</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Deskripsi */}
        <Text style={styles.label}>Deskripsi & Ciri-Ciri Barang</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tuliskan warna, merek, stiker, lecet khusus, atau isi barang..."
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Tombol Kirim */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color="#7f1d1d" />
              <Text style={styles.loadingText}>Mengirim laporan...</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>📢 Publikasikan Laporan Hilang</Text>
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
    padding: 18,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  bannerEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
  },
  bannerDesc: {
    fontSize: 12,
    color: '#7f1d1d',
    marginTop: 2,
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
    minHeight: 85,
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
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipSelected: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
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
    marginBottom: 12,
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
    height: 120,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  uploadPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  uploadPlaceholderText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  uploadActionBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadActionBtnSecondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  uploadActionBtnTextSecondary: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
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
  urlInputBox: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  urlSubmitBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#fca5a5',
  },
  submitBtnText: {
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
    color: '#7f1d1d',
    fontSize: 14,
    fontWeight: '700',
  },
});

