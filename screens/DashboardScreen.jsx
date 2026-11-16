import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const SAMPLE_RECENT = [
  {
    id: 'sample-1',
    type: 'lost',
    title: 'Kunci Motor Honda Beat Hitam',
    category: 'Kunci Motor / Rumah',
    location: 'Parkiran GK1',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=60',
    status: 'active',
    localDateString: 'Hari ini',
  },
  {
    id: 'sample-2',
    type: 'found',
    title: 'KTM BNI atas nama Rina',
    category: 'Kartu / Identitas / KTM',
    location: 'Kantin Pusat',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=60',
    status: 'active',
    localDateString: 'Kemarin',
  },
];

export default function DashboardScreen({ user: userProp, route, navigation }) {
  const user = userProp || route?.params?.user;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, 'lost_and_found'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setItems(list.length > 0 ? list : SAMPLE_RECENT);
          setLoading(false);
        },
        (error) => {
          console.warn('Dashboard firestore fallback:', error.message);
          setItems(SAMPLE_RECENT);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('Dashboard init error:', e);
      setItems(SAMPLE_RECENT);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            Alert.alert('Gagal Keluar', error.message);
          }
        },
      },
    ]);
  };

  const totalCount = items.length;
  const lostCount = items.filter((i) => i.type === 'lost').length;
  const foundCount = items.filter((i) => i.type === 'found').length;
  const resolvedCount = items.filter((i) => i.status === 'resolved').length;

  const myReports = items.filter((i) => i.userId === user?.uid);
  const myReportsCount = myReports.length;

  // Persentase penyelesaian laporan
  const resolutionRate =
    totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Mahasiswa';
  const avatarLetter = (displayName || 'U').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header Profil Mahasiswa */}
      <View style={styles.userCard}>
        <View style={styles.userCardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeLabel}>DASHBOARD MAHASISWA</Text>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Keluar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.userBadgeRow}>
          <View style={styles.statusBadgeActive}>
            <Text style={styles.statusBadgeText}>🟢 Akun Aktif Terverifikasi</Text>
          </View>
          <Text style={styles.userUid}>UID: {user?.uid?.slice(0, 8)}...</Text>
        </View>
      </View>

      {/* 2. Ringkasan Statistik Kampus (Analytics Metrik) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 Statistik Kampus</Text>
        <Text style={styles.sectionSubtitle}>Ringkasan laporan barang hilang & temuan</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardBlue]}>
          <Text style={styles.statEmoji}>📦</Text>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total Laporan</Text>
        </View>

        <View style={[styles.statCard, styles.statCardRed]}>
          <Text style={styles.statEmoji}>🔴</Text>
          <Text style={[styles.statNumber, styles.textRed]}>{lostCount}</Text>
          <Text style={styles.statLabel}>Barang Hilang</Text>
        </View>

        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={styles.statEmoji}>🟢</Text>
          <Text style={[styles.statNumber, styles.textGreen]}>{foundCount}</Text>
          <Text style={styles.statLabel}>Barang Temuan</Text>
        </View>

        <View style={[styles.statCard, styles.statCardGray]}>
          <Text style={styles.statEmoji}>✅</Text>
          <Text style={[styles.statNumber, styles.textGray]}>{resolvedCount}</Text>
          <Text style={styles.statLabel}>Selesai</Text>
        </View>
      </View>

      {/* Bar Persentase Keberhasilan Pengembalian */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Tingkat Pengembalian Barang</Text>
          <Text style={styles.progressPercentage}>{resolutionRate}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.min(resolutionRate, 100)}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          {resolvedCount} dari {totalCount} barang telah berhasil dikembalikan ke pemiliknya.
        </Text>
      </View>

      {/* 3. Menu Navigasi Cepat (Quick Action Grid) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⚡ Menu Layanan</Text>
        <Text style={styles.sectionSubtitle}>Akses langsung fitur utama aplikasi</Text>
      </View>

      <View style={styles.menuGrid}>
        {/* Tombol ke Beranda Feed */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('HomeTab')}
        >
          <View style={[styles.menuIconBox, styles.bgBlue]}>
            <Text style={styles.menuIcon}>🔍</Text>
          </View>
          <Text style={styles.menuTitle}>Jelajahi Barang</Text>
          <Text style={styles.menuDesc}>Cari & filter semua barang</Text>
        </TouchableOpacity>

        {/* Tombol Lapor Hilang */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ReportLost', { user })}
        >
          <View style={[styles.menuIconBox, styles.bgRed]}>
            <Text style={styles.menuIcon}>📢</Text>
          </View>
          <Text style={styles.menuTitle}>Lapor Hilang</Text>
          <Text style={styles.menuDesc}>Buat laporan kehilangan</Text>
        </TouchableOpacity>

        {/* Tombol Lapor Temuan */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ReportFound', { user })}
        >
          <View style={[styles.menuIconBox, styles.bgGreen]}>
            <Text style={styles.menuIcon}>🎁</Text>
          </View>
          <Text style={styles.menuTitle}>Lapor Temuan</Text>
          <Text style={styles.menuDesc}>Laporkan barang ditemukan</Text>
        </TouchableOpacity>

        {/* Tombol Laporan Saya */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyReports', { user })}
        >
          <View style={[styles.menuIconBox, styles.bgPurple]}>
            <Text style={styles.menuIcon}>📁</Text>
          </View>
          <Text style={styles.menuTitle}>Laporan Saya</Text>
          <Text style={styles.menuDesc}>{myReportsCount} laporan Anda</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Aktivitas Laporan Terkini di Kampus */}
      <View style={styles.recentSectionHeader}>
        <Text style={styles.sectionTitle}>🕒 Aktivitas Terkini di Kampus</Text>
        <TouchableOpacity onPress={() => navigation.navigate('HomeTab')}>
          <Text style={styles.viewAllLink}>Lihat Semua →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#2563eb" style={styles.loadingMargin} />
      ) : (
        items.slice(0, 3).map((item) => {
          const isLost = item.type === 'lost';
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.recentCard}
              onPress={() => navigation.navigate('ItemDetail', { item, user })}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.recentThumb} />
              ) : (
                <View style={styles.recentPlaceholder}>
                  <Text style={styles.recentPlaceholderText}>{isLost ? '🔴' : '🟢'}</Text>
                </View>
              )}

              <View style={styles.recentInfo}>
                <View style={styles.recentBadges}>
                  <Text style={[styles.miniBadge, isLost ? styles.badgeLost : styles.badgeFound]}>
                    {isLost ? 'HILANG' : 'DITEMUKAN'}
                  </Text>
                  <Text style={styles.recentDate}>{item.localDateString || 'Baru'}</Text>
                </View>
                <Text style={styles.recentTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.recentLocation} numberOfLines={1}>
                  📍 {item.location}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* 5. Informasi Pos Satpam Kampus & Bantuan */}
      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>🏢 Pos Satpam & Informasi Kampus</Text>
        <Text style={styles.helpDesc}>
          Jika Anda menemukan atau mencari barang berharga seperti Laptop, Handphone, Dompet, dan KTM, Anda dapat langsung mengunjungi Pos Satpam Utama di Gerbang Depan Kampus.
        </Text>
        <View style={styles.helpContactRow}>
          <Text style={styles.helpContactKey}>⏰ Jam Operasional:</Text>
          <Text style={styles.helpContactVal}>24 Jam Setiap Hari</Text>
        </View>
        <View style={styles.helpContactRow}>
          <Text style={styles.helpContactKey}>📞 Pos Keamanan:</Text>
          <Text style={styles.helpContactVal}>(0431) 891035 / Ext. 102</Text>
        </View>
      </View>
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
    paddingBottom: 30,
  },
  userCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 10,
    color: '#93c5fd',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  userBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusBadgeActive: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  userUid: {
    color: '#bfdbfe',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statCardBlue: {
    borderTopWidth: 3,
    borderTopColor: '#2563eb',
  },
  statCardRed: {
    borderTopWidth: 3,
    borderTopColor: '#dc2626',
  },
  statCardGreen: {
    borderTopWidth: 3,
    borderTopColor: '#16a34a',
  },
  statCardGray: {
    borderTopWidth: 3,
    borderTopColor: '#64748b',
  },
  statEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  textRed: {
    color: '#dc2626',
  },
  textGreen: {
    color: '#16a34a',
  },
  textGray: {
    color: '#64748b',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 11,
    color: '#64748b',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bgBlue: {
    backgroundColor: '#dbeafe',
  },
  bgRed: {
    backgroundColor: '#fee2e2',
  },
  bgGreen: {
    backgroundColor: '#dcfce7',
  },
  bgPurple: {
    backgroundColor: '#ede9fe',
  },
  loadingMargin: {
    marginVertical: 20,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 11,
    color: '#64748b',
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  recentThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  recentPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  recentPlaceholderText: {
    fontSize: 18,
  },
  recentInfo: {
    flex: 1,
  },
  recentBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  miniBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeLost: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  badgeFound: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  recentDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  recentLocation: {
    fontSize: 11,
    color: '#475569',
  },
  helpCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  helpDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#1e3a8a',
    marginBottom: 8,
  },
  helpContactRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  helpContactKey: {
    width: 120,
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  helpContactVal: {
    flex: 1,
    fontSize: 11,
    color: '#1e3a8a',
    fontWeight: '700',
  },
});
