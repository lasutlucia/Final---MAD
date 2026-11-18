import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { auth } from '../firebaseConfig';
import {
  subscribeComments,
  addComment,
  updateItem,
  deleteItem,
} from '../store/dataStore';

export default function ItemDetailScreen({ route, navigation }) {
  const initialItem = route.params?.item;
  const user = route.params?.user || auth.currentUser;

  const [item, setItem] = useState(initialItem);
  const [comments, setComments] = useState(initialItem?.comments || []);
  const [commentText, setCommentText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const currentUser = auth.currentUser || user;
  const isOwner = currentUser?.uid && currentUser.uid === item?.userId;
  const isLost = item?.type === 'lost';
  const isResolved = item?.status === 'resolved';

  // Berlangganan komentar secara real-time
  useEffect(() => {
    if (!initialItem?.id) return;

    const unsub = subscribeComments(initialItem.id, (loadedComments) => {
      setComments(loadedComments);
    });

    return () => unsub();
  }, [initialItem?.id]);

  const handleContactWhatsApp = () => {
    if (!item?.contact) {
      Alert.alert('Info Kontak', 'Nomor kontak tidak tersedia.');
      return;
    }

    let cleanNumber = item.contact.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.slice(1);
    }

    const message = encodeURIComponent(
      `Halo ${item.userName}, saya menghubungi Anda terkait laporan "${item.title}" di aplikasi Kampus Lost & Found.`
    );
    const url = `https://wa.me/${cleanNumber}?text=${message}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Gagal Membuka WhatsApp',
        `Nomor kontak pelapor adalah: ${item.contact}`
      );
    });
  };

  // Fitur Update Status Barang
  const handleToggleStatus = () => {
    const nextStatus = isResolved ? 'active' : 'resolved';
    let dialogTitle = '';
    let dialogMessage = '';

    if (isLost) {
      dialogTitle = isResolved
        ? 'Buka Kembali Pencarian?'
        : 'Barang Sudah Ditemukan?';
      dialogMessage = isResolved
        ? 'Status laporan akan diaktifkan kembali menjadi sedang dicari.'
        : 'Status akan diperbarui menjadi SUDAH DITEMUKAN.';
    } else {
      dialogTitle = isResolved
        ? 'Buka Kembali Laporan Temuan?'
        : 'Sudah Dikembalikan ke Pemilik?';
      dialogMessage = isResolved
        ? 'Status laporan akan diaktifkan kembali menjadi belum diambil.'
        : 'Status akan diperbarui menjadi SUDAH DIKEMBALIKAN KE PEMILIK.';
    }

    Alert.alert(dialogTitle, dialogMessage, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Ubah Status',
        onPress: async () => {
          setActionLoading(true);
          try {
            await updateItem(item.id, { status: nextStatus });
            setItem((prev) => ({ ...prev, status: nextStatus }));
            Alert.alert('Berhasil', 'Status laporan berhasil diperbarui!');
          } catch (error) {
            Alert.alert('Gagal Mengubah Status', error.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  // Fitur Hapus Laporan
  const handleDeleteItem = () => {
    Alert.alert(
      'Hapus Laporan',
      'Apakah Anda yakin ingin menghapus laporan ini secara permanen?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deleteItem(item.id);
              Alert.alert('Dihapus', 'Laporan telah berhasil dihapus.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Gagal Menghapus', error.message);
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Fitur Kirim Komentar (Baru)
  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    setSendingComment(true);
    try {
      await addComment(item.id, commentText.trim());
      setCommentText('');
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat mengirim komentar saat ini.');
    } finally {
      setSendingComment(false);
    }
  };

  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Laporan tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Foto Barang */}
      {item.imageUrl ? (
        <View style={styles.imageCard}>
          <Image source={{ uri: item.imageUrl }} style={styles.mainImage} />
        </View>
      ) : null}

      {/* Badges Tipe & Status */}
      <View style={styles.badgesRow}>
        <View
          style={[
            styles.typeBadge,
            isLost ? styles.typeBadgeLost : styles.typeBadgeFound,
          ]}
        >
          <Text
            style={[
              styles.typeBadgeText,
              isLost ? styles.typeBadgeTextLost : styles.typeBadgeTextFound,
            ]}
          >
            {isLost ? '🔴 BARANG HILANG' : '🟢 BARANG DITEMUKAN'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            isResolved ? styles.statusBadgeResolved : styles.statusBadgeActive,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              isResolved
                ? styles.statusBadgeTextResolved
                : styles.statusBadgeTextActive,
            ]}
          >
            {isResolved
              ? isLost
                ? '✓ SUDAH DITEMUKAN'
                : '✓ SUDAH DIKEMBALIKAN'
              : isLost
              ? '⏳ SEDANG DICARI'
              : '⏳ MENUNGGU DIAMBIL'}
          </Text>
        </View>
      </View>

      {/* Judul & Kategori */}
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>📁 {item.category || 'Umum'}</Text>
      </View>

      {/* Detail Informasi */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Detail Informasi</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>📍 Lokasi di Kampus:</Text>
          <Text style={styles.infoVal}>{item.location}</Text>
        </View>

        {item.currentLocation ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>🏢 Tempat Pengambilan:</Text>
            <Text style={styles.infoValHighlight}>{item.currentLocation}</Text>
          </View>
        ) : null}

        {item.dateIncident ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>⏰ Waktu Kejadian:</Text>
            <Text style={styles.infoVal}>{item.dateIncident}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>📅 Tanggal Laporan:</Text>
          <Text style={styles.infoVal}>
            {item.localDateString || 'Hari ini'}
          </Text>
        </View>
      </View>

      {/* Deskripsi */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Deskripsi & Ciri-Ciri</Text>
        <Text style={styles.descriptionText}>
          {item.description || 'Tidak ada deskripsi tambahan yang diberikan.'}
        </Text>
      </View>

      {/* Informasi Pelapor & WhatsApp */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>
          {isLost ? 'Informasi Pemilik Barang' : 'Informasi Penemu Barang'}
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>👤 Nama:</Text>
          <Text style={styles.infoVal}>{item.userName || 'Warga Kampus'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>✉️ Email:</Text>
          <Text style={styles.infoVal}>{item.userEmail || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>📞 Kontak:</Text>
          <Text style={styles.infoVal}>{item.contact || '-'}</Text>
        </View>

        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleContactWhatsApp}
        >
          <Text style={styles.whatsappButtonText}>
            💬 Hubungi via WhatsApp ({item.contact || 'Kirim Pesan'})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fitur Komentar / Diskusi Warga Kampus */}
      <View style={styles.card}>
        <View style={styles.commentHeaderRow}>
          <Text style={styles.cardHeader}>💬 Diskusi & Komentar</Text>
          <Text style={styles.commentCountBadge}>
            {comments.length} komentar
          </Text>
        </View>
        <Text style={styles.commentHint}>
          Bantu berikan info atau koordinasi langsung di sini.
        </Text>

        {/* Daftar Komentar */}
        {comments.length === 0 ? (
          <View style={styles.emptyCommentBox}>
            <Text style={styles.emptyCommentText}>
              Belum ada komentar. Berikan informasi pertama untuk membantu!
            </Text>
          </View>
        ) : (
          comments.map((c) => {
            const isReporterComment = c.userId === item.userId;
            const authorInitial = (c.userName || 'U').charAt(0).toUpperCase();

            return (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{authorInitial}</Text>
                </View>

                <View style={styles.commentBody}>
                  <View style={styles.commentAuthorRow}>
                    <Text style={styles.commentAuthorName}>{c.userName}</Text>
                    {isReporterComment ? (
                      <View style={styles.reporterBadge}>
                        <Text style={styles.reporterBadgeText}>
                          {isLost ? 'Pemilik' : 'Penemu'}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={styles.commentTime}>{c.dateString || ''}</Text>
                  </View>
                  <Text style={styles.commentContent}>{c.text}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Form Tambah Komentar */}
        <View style={styles.addCommentBox}>
          <TextInput
            style={styles.commentInput}
            placeholder="Tulis info / komentar Anda..."
            placeholderTextColor="#9ca3af"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendCommentBtn,
              (!commentText.trim() || sendingComment) &&
                styles.sendCommentBtnDisabled,
            ]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || sendingComment}
          >
            {sendingComment ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.sendCommentBtnText}>Kirim</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Kontrol Khusus Pemilik Laporan */}
      {isOwner ? (
        <View style={styles.ownerControlsCard}>
          <Text style={styles.ownerSectionTitle}>Kelola Laporan Milik Anda</Text>

          {actionLoading ? (
            <ActivityIndicator color="#2563eb" style={styles.loadingMargin} />
          ) : (
            <>
              {/* Tombol Update Status */}
              <TouchableOpacity
                style={[
                  styles.resolveButton,
                  isResolved && styles.unresolveButton,
                ]}
                onPress={handleToggleStatus}
              >
                <Text style={styles.resolveButtonText}>
                  {isResolved
                    ? '↩️ Aktifkan Kembali Laporan'
                    : isLost
                    ? '✅ Tandai Sudah Ditemukan'
                    : '✅ Tandai Sudah Dikembalikan'}
                </Text>
              </TouchableOpacity>

              {/* Tombol Edit Laporan */}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditReport', { item })}
              >
                <Text style={styles.editButtonText}>✏️ Edit Laporan Ini</Text>
              </TouchableOpacity>

              {/* Tombol Hapus Laporan */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteItem}
              >
                <Text style={styles.deleteButtonText}>🗑️ Hapus Laporan</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#64748b',
    fontSize: 14,
  },
  imageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainImage: {
    width: '100%',
    height: 230,
    resizeMode: 'cover',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeBadgeLost: {
    backgroundColor: '#fee2e2',
  },
  typeBadgeFound: {
    backgroundColor: '#dcfce7',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  typeBadgeTextLost: {
    color: '#b91c1c',
  },
  typeBadgeTextFound: {
    color: '#15803d',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeResolved: {
    backgroundColor: '#e2e8f0',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: '#b45309',
  },
  statusBadgeTextResolved: {
    color: '#475569',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 14,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730a3',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoKey: {
    width: 140,
    fontSize: 13,
    color: '#64748b',
  },
  infoVal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  infoValHighlight: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0369a1',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  whatsappButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  whatsappButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  commentCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  commentHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 10,
  },
  emptyCommentBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyCommentText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  commentBody: {
    flex: 1,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  reporterBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  reporterBadgeText: {
    fontSize: 10,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  commentContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  addCommentBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    maxHeight: 80,
  },
  sendCommentBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCommentBtnDisabled: {
    backgroundColor: '#93c5fd',
  },
  sendCommentBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  ownerControlsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ownerSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  loadingMargin: {
    marginVertical: 12,
  },
  resolveButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  unresolveButton: {
    backgroundColor: '#64748b',
  },
  resolveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
  },
});
