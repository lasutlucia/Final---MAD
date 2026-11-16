import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const CATEGORIES = [
  'Semua Kategori',
  'Kartu / Identitas / KTM',
  'Elektronik & Gadget',
  'Kunci Motor / Rumah',
  'Buku & Alat Tulis',
  'Pakaian & Aksesoris',
  'Dompet & Uang',
  'Lain-lain',
];

export default function HomeScreen({ user: userProp, route, navigation }) {
  const user = userProp || route?.params?.user;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'lost' | 'found'
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, 'lost_and_found'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setItems(list);
          setLoading(false);
        },
        (error) => {
          console.warn('HomeScreen firestore error:', error.message);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('HomeScreen init error:', e);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const filteredItems = items.filter((item) => {
    if (selectedType === 'lost' && item.type !== 'lost') return false;
    if (selectedType === 'found' && item.type !== 'found') return false;

    if (
      selectedCategory !== 'Semua Kategori' &&
      item.category !== selectedCategory
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchLocation = item.location?.toLowerCase().includes(q);
      const matchCategory = item.category?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      return matchTitle || matchLocation || matchCategory || matchDesc;
    }

    return true;
  });

  const lostCount = items.filter((i) => i.type === 'lost').length;
  const foundCount = items.filter((i) => i.type === 'found').length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Input Pencarian */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama barang, kategori, lokasi kampus..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tipe: Semua / Hilang / Ditemukan */}
        <View style={styles.typeFilterRow}>
          <TouchableOpacity
            style={[
              styles.typeFilterBtn,
              selectedType === 'all' && styles.typeFilterBtnActive,
            ]}
            onPress={() => setSelectedType('all')}
          >
            <Text
              style={[
                styles.typeFilterText,
                selectedType === 'all' && styles.typeFilterTextActive,
              ]}
            >
              Semua ({items.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeFilterBtn,
              selectedType === 'lost' && styles.typeFilterBtnLostActive,
            ]}
            onPress={() => setSelectedType('lost')}
          >
            <Text
              style={[
                styles.typeFilterText,
                selectedType === 'lost' && styles.typeFilterTextActive,
              ]}
            >
              🔴 Hilang ({lostCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeFilterBtn,
              selectedType === 'found' && styles.typeFilterBtnFoundActive,
            ]}
            onPress={() => setSelectedType('found')}
          >
            <Text
              style={[
                styles.typeFilterText,
                selectedType === 'found' && styles.typeFilterTextActive,
              ]}
            >
              🟢 Ditemukan ({foundCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Kategori Horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(cat)}
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

        {/* Header Daftar */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Semua Laporan Barang</Text>
          <Text style={styles.feedCount}>{filteredItems.length} barang</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Memuat data barang kampus...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              Tidak ada barang yang cocok dengan kriteria pencarian Anda.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const isLost = item.type === 'lost';
            const isResolved = item.status === 'resolved';

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, isResolved && styles.itemCardResolved]}
                onPress={() =>
                  navigation.navigate('ItemDetail', { item, user })
                }
              >
                {/* Header Kartu */}
                <View style={styles.itemHeader}>
                  <View
                    style={[
                      styles.typeBadge,
                      isLost ? styles.typeBadgeLost : styles.typeBadgeFound,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        isLost
                          ? styles.typeBadgeTextLost
                          : styles.typeBadgeTextFound,
                      ]}
                    >
                      {isLost ? '🔴 HILANG' : '🟢 DITEMUKAN'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isResolved
                        ? styles.statusBadgeResolved
                        : styles.statusBadgeActive,
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
                          ? 'SUDAH DITEMUKAN'
                          : 'SUDAH DIKEMBALIKAN'
                        : isLost
                        ? 'SEDANG DICARI'
                        : 'BELUM DIAMBIL'}
                    </Text>
                  </View>
                </View>

                {/* Konten Kartu dengan Foto Barang */}
                <View style={styles.itemCardBody}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.itemThumbnail}
                    />
                  ) : (
                    <View style={styles.itemThumbnailPlaceholder}>
                      <Text style={styles.placeholderIcon}>
                        {isLost ? '🔍' : '🎁'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.itemCardInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemCategory}>📁 {item.category}</Text>
                    <Text style={styles.itemLocation}>📍 {item.location}</Text>
                    {item.currentLocation ? (
                      <Text style={styles.itemStorage}>
                        🏢 {item.currentLocation}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Footer Kartu */}
                <View style={styles.itemFooter}>
                  <Text style={styles.reporterText}>
                    👤 {item.userName || 'Warga Kampus'} • {item.localDateString || 'Baru'}
                  </Text>
                  <Text style={styles.detailLink}>Detail & Kontak →</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fabBtn, styles.fabLost]}
          onPress={() => navigation.navigate('ReportLost', { user })}
        >
          <Text style={styles.fabBtnText}>📢 Lapor Hilang</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fabBtn, styles.fabFound]}
          onPress={() => navigation.navigate('ReportFound', { user })}
        >
          <Text style={styles.fabBtnText}>🎁 Lapor Temuan</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 90,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    padding: 0,
  },
  clearSearch: {
    fontSize: 14,
    color: '#9ca3af',
    paddingHorizontal: 6,
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  typeFilterBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  typeFilterBtnActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  typeFilterBtnLostActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  typeFilterBtnFoundActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  typeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeFilterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
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
    fontWeight: '700',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  feedCount: {
    fontSize: 12,
    color: '#64748b',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  itemCardResolved: {
    opacity: 0.75,
    borderLeftColor: '#94a3b8',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 10,
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
  itemCardBody: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  itemThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  itemThumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  placeholderIcon: {
    fontSize: 28,
  },
  itemCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  itemLocation: {
    fontSize: 12,
    color: '#2563eb',
    marginBottom: 2,
  },
  itemStorage: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reporterText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  detailLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  fabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  fabLost: {
    backgroundColor: '#dc2626',
  },
  fabFound: {
    backgroundColor: '#16a34a',
  },
  fabBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
