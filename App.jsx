import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import HomeScreen from './screens/HomeScreen';
import ReportLostScreen from './screens/ReportLostScreen';
import ReportFoundScreen from './screens/ReportFoundScreen';
import MyReportsScreen from './screens/MyReportsScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import EditReportScreen from './screens/EditReportScreen';
import CreateReportScreen from './screens/CreateReportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Ikon Tab didefinisikan di luar komponen render agar tidak dibuat ulang (sesuai aturan ESLint)
function DashboardTabIcon() {
  return <Text style={styles.tabIcon}>📊</Text>;
}

function HomeTabIcon() {
  return <Text style={styles.tabIcon}>🔍</Text>;
}

function MyReportsTabIcon() {
  return <Text style={styles.tabIcon}>📁</Text>;
}

// Komponen Tab Navigasi Utama Mahasiswa
function MainTabs({ route }) {
  const user = route.params?.user;

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.headerStyle,
        headerTintColor: '#1e293b',
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
      }}
    >
      {/* Tab 1: Dashboard Analitik & Layanan Mahasiswa */}
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        initialParams={{ user }}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerTitle: 'Dashboard Mahasiswa',
          tabBarIcon: DashboardTabIcon,
        }}
      />

      {/* Tab 2: Halaman Beranda (Explore & Cari Barang) */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        initialParams={{ user }}
        options={{
          title: 'Beranda',
          tabBarLabel: 'Cari Barang',
          headerTitle: 'Kampus Lost & Found',
          tabBarIcon: HomeTabIcon,
        }}
      />

      {/* Tab 3: Laporan Pengguna (My Reports) */}
      <Tab.Screen
        name="MyReportsTab"
        component={MyReportsScreen}
        initialParams={{ user }}
        options={{
          title: 'Laporan Saya',
          tabBarLabel: 'Laporan Saya',
          headerTitle: 'Laporan Saya (My Reports)',
          tabBarIcon: MyReportsTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dengarkan status autentikasi dari Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: styles.headerStyle,
            headerTintColor: '#1e293b',
            headerTitleStyle: styles.headerTitle,
            headerShadowVisible: false,
          }}
        >
          {user ? (
            // Alur Pengguna Terautentikasi (Mahasiswa)
            <>
              {/* Tab Utama (Dashboard, Beranda, Laporan Saya) */}
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                initialParams={{ user }}
                options={{ headerShown: false }}
              />

              {/* Formulir Lapor Barang Hilang */}
              <Stack.Screen
                name="ReportLost"
                component={ReportLostScreen}
                options={{
                  title: '📢 Lapor Barang Hilang',
                  headerBackTitle: 'Kembali',
                }}
              />

              {/* Formulir Lapor Barang Temuan */}
              <Stack.Screen
                name="ReportFound"
                component={ReportFoundScreen}
                options={{
                  title: '🎁 Lapor Barang Temuan',
                  headerBackTitle: 'Kembali',
                }}
              />

              {/* Rute Langsung Laporan Saya */}
              <Stack.Screen
                name="MyReports"
                component={MyReportsScreen}
                options={{
                  title: '📁 Laporan Saya',
                  headerBackTitle: 'Kembali',
                }}
              />

              {/* Detail Informasi Barang */}
              <Stack.Screen
                name="ItemDetail"
                component={ItemDetailScreen}
                options={{
                  title: 'Detail Barang',
                  headerBackTitle: 'Kembali',
                }}
              />

              {/* Edit Laporan Milik Sendiri */}
              <Stack.Screen
                name="EditReport"
                component={EditReportScreen}
                options={{
                  title: '✏️ Edit Laporan',
                  headerBackTitle: 'Kembali',
                }}
              />

              {/* Formulir Umum Tambahan */}
              <Stack.Screen
                name="CreateReport"
                component={CreateReportScreen}
                options={{
                  title: 'Formulir Laporan Barang',
                  headerBackTitle: 'Kembali',
                }}
              />
            </>
          ) : (
            // Alur Masuk & Daftar Mahasiswa
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                  title: 'Pendaftaran Mahasiswa',
                  headerBackTitle: 'Kembali',
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
  },
  headerStyle: {
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontWeight: '700',
  },
});
