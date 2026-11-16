import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function MyReportsScreen({ user: userProp, route, navigation }) {
  const user = userProp || route?.params?.user;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'lost' | 'found'

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};
    try {
      const q = query(
        collection(db, 'lost_and_found'),
        where('userId', '==', user.uid)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() });
          });
          setItems(list);
          setLoading(false);
        },
        (error) => {
          console.warn('MyReports fetch error:', error.message);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('MyReports error:', e);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user]);

  // Toggle status barang (Feature 10)
  const handleToggleStatus = (item) => {
    const isLost = item.type === 'lost';
    const isCurrentlyResolved = item.status === 'resolved';

    let nextStatus = isCurrentlyResolved ? 'active' : 'resolved';
    let dialogTitle = '';
    let dialogMessage = '';

    if (isLost) {
      dialogTitle = isCurrentlyResolved ? 'Buka Kembali Pencarian?' : 'Barang Sudah Ditemukan?';
      dialogMessage = isCurrentlyResolved
        ? 'Status akan diubah kembali menjadi barang hilang aktif.'
        : 'Selamat! Status akan diubah menjadi sudah ditemukan.';
    } else {
      dialogTitle = isCurrentlyResolved ? 'Buka Kembali Laporan Temuan?' : 'Sudah Dikembalikan ke Pemilik?';
      dialogMessage = isCurrentlyResolved
        ? 'Status akan diubah kembali menjadi belum diambil.'
        : 'Status akan diubah menjadi sudah dikembalikan ke pemilik.';
    }

    Alert.alert(dialogTitle, dialogMessage, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Ubah Status',
        onPress: async () => {
          try {
            await updateDoc(doc(db, 'lost_and_found', item.id), {
              status: nextStatus,
            });
            Alert.alert('Berhasil', 'Status laporan berhasil diperbarui!');
          } catch (error) {
            Alert.alert('Gagal Mengubah Status', error.message);
          }
        },
      },
    ]);
  };

  const handleDeleteItem = (item) => {
    Alert.alert('Hapus Laporan', `Hapus laporan "${item.title}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'lost_and_found', item.id));
            Alert.alert('Dihapus', 'Laporan berhasil dihapus.');
          } catch (error) {
            Alert.alert('Gagal Menghapus', error.message);
          }
        },
      },
    ]);
  };

  const filteredItems = items.filter((item) => {
    if (filterType === 'lost') return item.type === 'lost';
    if (filterType === 'found') return item.type === 'found';
    return true;
  });

  const totalCount = items.length;
  const lostCount = items.filter((i) => i.type === 'lost').length;
  const foundCount = items.filter((i) => i.type === 'found').length;
  const resolvedCount = items.filter((i) => i.status === 'resolved').length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ringkasan Laporan Saya */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Laporan Saya (My Reports)</Text>
          <Text style={styles.summarySubtitle}>
            Kelola dan perbarui status laporan barang yang Anda buat
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{totalCount}</Text>
              <Text style={styles.statLbl}>Total Laporan</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, styles.statValLost]}>{lostCount}</Text>
              <Text style={styles.statLbl}>Barang Hilang</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, styles.statValFound]}>{foundCount}</Text>
              <Text style={styles.statLbl}>Barang Temuan</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, styles.statValResolved]}>{resolvedCount}</Text>
              <Text style={styles.statLbl}>Selesai</Text>
            </View>
          </View>
        </View>

        {/* Filter Chip */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
              Semua ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'lost' && styles.filterChipActive]}
            onPress={() => setFilterType('lost')}
          >
            <Text style={[styles.filterChipText, filterType === 'lost' && styles.filterChipTextActive]}>
              🔴 Hilang ({lostCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'found' && styles.filterChipActive]}
            onPress={() => setFilterType('found')}
          >
            <Text style={[styles.filterChipText, filterType === 'found' && styles.filterChipTextActive]}>
              🟢 Ditemukan ({foundCount})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Memuat laporan Anda...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Belum Ada Laporan</Text>
            <Text style={styles.emptySubtitle}>
              Anda belum membuat laporan di kategori ini.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const isLost = item.type === 'lost';
            const isResolved = item.status === 'resolved';

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.cardHeader}>
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
                      {isLost ? '🔴 HILANG' : '🟢 DITEMUKAN'}
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
                        isResolved ? styles.statusBadgeTextResolved : styles.statusBadgeTextActive,
                      ]}
                    >
                      {isResolved
                        ? isLost
                          ? '✓ DITEMUKAN'
                          : '✓ DIKEMBALIKAN'
                        : isLost
                        ? 'BELUM DITEMUKAN'
                        : 'BELUM DIAMBIL'}
                    </Text>
                  </View>
                </View>

                {/* Konten dengan Foto */}
                <View style={styles.itemBody}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Text style={styles.thumbPlaceholderIcon}>
                        {isLost ? '🔍' : '🎁'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>📁 {item.category}</Text>
                    <Text style={styles.itemMeta}>📍 {item.location}</Text>
                    <Text style={styles.itemDate}>📅 {item.localDateString || 'Baru'}</Text>
                  </View>
                </View>

                {/* Tombol Aksi Langsung (Edit, Update Status, Hapus) */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusActionBtn,
                      isResolved ? styles.statusActionBtnReopen : styles.statusActionBtnResolve,
                    ]}
                    onPress={() => handleToggleStatus(item)}
                  >
                    <Text style={styles.statusActionBtnText}>
                      {isResolved
                        ? '↩️ Buka Kembali'
                        : isLost
                        ? '✅ Tandai Ditemukan'
                        : '✅ Tandai Dikembalikan'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editActionBtn}
                    onPress={() => navigation.navigate('EditReport', { item })}
                  >
                    <Text style={styles.editActionBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteActionBtn}
                    onPress={() => handleDeleteItem(item)}
                  >
                    <Text style={styles.deleteActionBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#bfdbfe',
    marginTop: 2,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 10,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  statValLost: {
    color: '#ef4444',
  },
  statValFound: {
    color: '#22c55e',
  },
  statValResolved: {
    color: '#64748b',
  },
  statLbl: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeLost: {
    backgroundColor: '#fee2e2',
  },
  typeBadgeFound: {
    backgroundColor: '#dcfce7',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadgeTextLost: {
    color: '#b91c1c',
  },
  typeBadgeTextFound: {
    color: '#15803d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeResolved: {
    backgroundColor: '#e2e8f0',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: '#b45309',
  },
  statusBadgeTextResolved: {
    color: '#475569',
  },
  itemBody: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  thumbImage: {
    width: 75,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  thumbPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  thumbPlaceholderIcon: {
    fontSize: 26,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
  },
  itemMeta: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statusActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusActionBtnResolve: {
    backgroundColor: '#16a34a',
  },
  statusActionBtnReopen: {
    backgroundColor: '#64748b',
  },
  statusActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  editActionBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteActionBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionBtnText: {
    fontSize: 14,
  },
});

