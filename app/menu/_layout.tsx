import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Pressable, Platform, AppState,
  BackHandler, Alert, ActivityIndicator // Tambahkan ActivityIndicator untuk penahan loading
} from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const MENU_ITEMS = [
  { label: 'Keranjang', route: '/menu/transaksi', icon: '🛒' },
  { label: 'Transaksi', route: '/menu/menu-transaksi', icon: '💳' },
  { label: 'Pendapatan', route: '/menu/pendapatan', icon: '📊' },
];

export default function MenuLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [showBurger, setShowBurger] = useState(false);
  const [username, setUsername] = useState('Memuat...');
  
  // =================================================================
  // GERBANG UTAMA: State untuk menahan render sebelum auth terverifikasi
  // =================================================================
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const currentScreen = segments[segments.length - 1];
  const getRouteKey = (route: string) => route.replace('/menu/', '');

  // =================================================================
  // 1. TOMBOL BACK HP + FLUSH SESSION
  // =================================================================
  useEffect(() => {
    if (Platform.OS === 'android') {
      const handleTombolBackHP = () => {
        if (currentScreen === 'koleksi-barang') {
          Alert.alert(
            'Keluar Aplikasi',
            'Apakah anda ingin keluar dan logout dari akun saat ini?',
            [
              {
                text: 'Batal',
                onPress: () => console.log('Batal keluar'),
                style: 'cancel',
              },
              {
                text: 'Keluar & Logout',
                onPress: async () => {
                  try {
                    await AsyncStorage.removeItem('user_id'); 
                    console.log('Session berhasil dibersihkan total!');
                  } catch (e) {
                    console.log('Gagal hapus session:', e);
                  } finally {
                    BackHandler.exitApp(); 
                  }
                },
                style: 'destructive',
              },
            ],
            { cancelable: true }
          );
          return true; 
        }
        return false; 
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', handleTombolBackHP);
      return () => subscription.remove();
    }
  }, [currentScreen]);

  // =================================================================
  // 2. AUTH GUARD KETAT (BLOKIR SEBELUM BENAR-BENAR AMAN)
  // =================================================================
  useEffect(() => {
    const validasiDanAmbilUser = async () => {
      try {
        const simpananId = await AsyncStorage.getItem('user_id');

        // JIKA KOSONG: Tendang langsung tanpa ampun ke halaman Login (/)
        if (!simpananId) {
          console.log('Akses ditolak: Session kosong, me-redirect ke Login...');
          router.replace('/'); 
          return; // STOP di sini, jangan ubah isAuthChecked jadi true!
        }

        // JIKA ADA ID: Cek datanya ke Supabase
        const { data: dataUser, error } = await supabase
          .from('user')
          .select('nama')
          .eq('id', parseInt(simpananId))
          .single();

        if (dataUser && dataUser.nama) {
          setUsername(dataUser.nama);
          setIsAuthChecked(true); // Lolos verifikasi! Boleh buka gerbang aplikasi
        } else {
          // ID ada tapi di DB gak ada (Data palsu / expired)
          await AsyncStorage.removeItem('user_id');
          router.replace('/');
        }

      } catch (err) {
        console.log('Gagal validasi session user:', err);
        router.replace('/');
      }
    };

    validasiDanAmbilUser();
  }, [currentScreen, showBurger]);

  // =================================================================
  // FULL SCREEN HANDLER Android (VERSI BERSIH ANTI-WARN)
  // =================================================================
  useEffect(() => {
    if (Platform.OS === 'android') {
      const aktifkanFullScreen = async () => {
        try {
          // HAPUS atau komentari dua baris yang bikin warn di bawah ini:
          // await NavigationBar.setPositionAsync('absolute'); ❌
          // await NavigationBar.setBehaviorAsync('overlay-swipe'); ❌

          // Cukup sisakan baris ini untuk menyembunyikan tombol navigasi bawah:
          await NavigationBar.setVisibilityAsync('hidden');
        } catch (error) {
          console.log('Gagal mengunci fullscreen:', error);
        }
      };
      
      aktifkanFullScreen();
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          aktifkanFullScreen();
        }
      });
      return () => subscription.remove();
    }
  }, []);

  // =================================================================
  // TAMPILAN GERBANG PENAHAN (ANTI-BOCOR DATA)
  // =================================================================
  if (!isAuthChecked) {
    // Tampilkan layar loading polos sewarna tema lu selama milidetik pengecekan
    return (
      <View style={styles.gatekeeperContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // JIKA LOLOS VERIFIKASI, BARULAH KODE DI BAWAH INI AKAN DI-RENDER
  return (
    <>
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />

      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#6C40C7' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerLeft: () => (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowBurger(true)}>
              <Text style={styles.menuButtonText}>MENU</Text>
            </TouchableOpacity>
          ),
        }}>
        <Stack.Screen name="koleksi-barang" options={{ title: 'Katalog Utama' }} />
        <Stack.Screen name="add-barang" options={{ title: 'Tambah Barang' }} />
        <Stack.Screen name="detail-barang" options={{ title: 'Detail Barang' }} />
        <Stack.Screen name="edit-barang" options={{ title: 'Edit Barang' }} />
        <Stack.Screen name="pemberitahuan" options={{ title: 'Pemberitahuan' }} />
        <Stack.Screen name="search-bar" options={{ title: 'Cari Barang' }} />
        <Stack.Screen name="transaksi" options={{ title: 'Keranjang' }} />
        <Stack.Screen name="menu-transaksi" options={{ title: 'Riwayat Transaksi' }} />
        <Stack.Screen name="pendapatan" options={{ title: 'Pendapatan' }} />
      </Stack>

      {/* Burger Menu Modal */}
      <Modal
        visible={showBurger}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBurger(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowBurger(false)}>
          <Pressable style={styles.drawer}>
            
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerStoreName} numberOfLines={1}>
                {username}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowBurger(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>MENU</Text>
            {MENU_ITEMS.map((item) => {
              const isActive = currentScreen === getRouteKey(item.route);
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => {
                    if (!isActive) router.push(item.route as any);
                    setShowBurger(false);
                  }}
                  disabled={isActive}>
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                    {item.label}
                  </Text>
                  {isActive && <Text style={styles.activeIndicator}>●</Text>}
                </TouchableOpacity>
              );
            })}

            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.mainMenuItem}
              onPress={() => {
                router.replace('/menu/koleksi-barang');
                setShowBurger(false);
              }}>
              <Text style={styles.menuItemIcon}>🏠</Text>
              <Text style={styles.mainMenuText}>Kembali ke Katalog</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem('user_id'); 
                  setShowBurger(false);
                  router.replace('/'); 
                } catch (e) {
                  console.log('Gagal logout:', e);
                }
              }}>
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={styles.logoutButtonText}>Keluar / Logout</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Tambahan style untuk gerbang loading penahan data
  gatekeeperContainer: { flex: 1, backgroundColor: '#6C40C7', justifyContent: 'center', alignItems: 'center' },
  
  menuButton: { marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  menuButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  drawer: { width: '75%', maxWidth: 300, backgroundColor: '#fff', paddingTop: 50, paddingBottom: 30 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6C40C7', paddingHorizontal: 16, paddingVertical: 20, gap: 12, marginBottom: 8 },
  drawerStoreName: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  closeButton: { padding: 4 },
  closeButtonText: { fontSize: 18, color: '#fff' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', paddingHorizontal: 16, paddingVertical: 8, letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemActive: { backgroundColor: '#E8D8FF', opacity: 0.7 },
  menuItemIcon: { fontSize: 20 },
  menuItemText: { fontSize: 15, color: '#333', fontWeight: '500', flex: 1 },
  menuItemTextActive: { color: '#6C40C7', fontWeight: '700' },
  activeIndicator: { fontSize: 10, color: '#6C40C7' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 16, marginVertical: 8 },
  mainMenuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  mainMenuText: { fontSize: 15, color: '#333', fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  logoutButtonText: { fontSize: 15, color: '#FF3B30', fontWeight: '700' }
});