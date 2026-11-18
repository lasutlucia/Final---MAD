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
import { updateItem, deleteItem } from '../store/dataStore';

const CATEGORIES = [
  'Kartu / Identitas / KTM',
  'Elektronik & Gadget',
  'Kunci Motor / Rumah',
  'Buku & Alat Tulis',
  'Pakaian & Aksesoris',
  'Dompet & Uang',
  'Lain-lain',
];

export default function EditReportScreen({ navigation, route }) {
  const { item } = route.params;

  const [title, setTitle] = useState(item.title || '');
  const [category, setCategory] = useState(item.category || CATEGORIES[0]);
  const [location, setLocation] = useState(item.location || '');
  const [currentLocation, setCurrentLocation] = useState(item.currentLocation || '');
  const [dateIncident, setDateIncident] = useState(item.dateIncident || '');
  const [contact, setContact] = useState(item.contact || '');
  const [description, setDescription] = useState(item.description || '');
  const [imageUri, setImageUri] = useState(item.imageUrl || '');
  const [loading, setLoading] = useState(false);

  const isLost = item.type === 'lost';

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

  const handleUpdate = async () => {
    if (!title.trim() || !location.trim() || !contact.trim()) {
      Alert.alert(
        'Kolom Belum Lengkap',
        'Harap isi Nama Barang, Lokasi di Kampus, dan Nomor Kontak.'
      );
      return;
    }

    setLoading(true);
    try {
      await updateItem(item.id, {
        title: title.trim(),
        category,
        location: location.trim(),
        currentLocation: !isLost ? currentLocation.trim() : '',
        dateIncident: dateIncident.trim(),
        contact: contact.trim(),
        description: description.trim(),
        imageUrl: imageUri || '',
      });

      Alert.alert('Berhasil', 'Laporan berhasil diperbarui!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Gagal Memperbarui', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Hapus Laporan', 'Yakin ingin menghapus laporan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteItem(item.id);
            Alert.alert('Dihapus', 'Laporan berhasil dihapus.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch (error) {
            Alert.alert('Gagal Menghapus', error.message);
            setLoading(false);
          }
        },
      },
    ]);
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
        <Text style={styles.formTitle}>Edit Laporan Barang</Text>
        <Text style={styles.formSubtitle}>
          Perbarui rincian, lokasi, kontak, atau foto barang Anda
        </Text>

        {/* Nama Barang */}
        <Text style={styles.label}>Nama Barang *</Text>
        <TextInput
          style={styles.input}
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

        {/* Lokasi */}
        <Text style={styles.label}>Lokasi di Kampus *</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />

        {/* Lokasi Dititipkan (khusus found) */}
        {!isLost ? (
          <>
            <Text style={styles.label}>Posisi Barang Saat Ini (Tempat Pengambilan)</Text>
            <TextInput
              style={styles.input}
              value={currentLocation}
              onChangeText={setCurrentLocation}
            />
          </>
        ) : null}

        {/* Waktu Kejadian */}
        <Text style={styles.label}>Waktu / Tanggal Kejadian</Text>
        <TextInput
          style={styles.input}
          value={dateIncident}
          onChangeText={setDateIncident}
        />

        {/* Kontak */}
        <Text style={styles.label}>Nomor WhatsApp / HP *</Text>
        <TextInput
          style={styles.input}
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
        />

        {/* Foto Barang */}
        <Text style={styles.label}>Foto Barang</Text>
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
                Tidak ada foto
              </Text>
            </View>
          )}

          <View style={styles.uploadActionsRow}>
            <TouchableOpacity
              style={styles.uploadActionBtn}
              onPress={handlePickImage}
            >
              <Text style={styles.uploadActionBtnText}>🖼️ Ganti dari Galeri</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadActionBtn}
              onPress={handleTakePhoto}
            >
              <Text style={styles.uploadActionBtnText}>📸 Ambil Foto Baru</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Deskripsi */}
        <Text style={styles.label}>Deskripsi & Ciri-Ciri</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Tombol Simpan Perubahan */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.btnDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveBtnText}>💾 Simpan Perubahan</Text>
          )}
        </TouchableOpacity>

        {/* Tombol Hapus */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={loading}
        >
          <Text style={styles.deleteBtnText}>🗑️ Hapus Laporan Ini</Text>
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
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
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
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  btnDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
  },
});

