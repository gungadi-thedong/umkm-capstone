import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Pressable,
} from 'react-native';

const MENU_ITEMS = [
  { label: 'Keranjang', route: '/menu/transaksi', icon: '🛒' },
  { label: 'Transaksi', route: '/menu/menu-transaksi', icon: '💳' },
  { label: 'Pendapatan', route: '/menu/pendapatan', icon: '📊' },
];

export default function MenuLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [showBurger, setShowBurger] = useState(false);

  // Ambil nama screen aktif sekarang
  const currentScreen = segments[segments.length - 1];

  const getRouteKey = (route: string) => route.replace('/menu/', '');

  return (
    <>
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
        <Stack.Screen name="test-insert" options={{ headerShown: false }} />
        <Stack.Screen name="search-dash" options={{ headerShown: false }} />
        <Stack.Screen name="deskripsi-barang" options={{ headerShown: false }} />
      </Stack>

      {/* Burger Menu Modal */}
      <Modal
        visible={showBurger}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBurger(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowBurger(false)}>
          <Pressable style={styles.drawer}>
            {/* Header Drawer */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerAvatar}>
                <Text style={styles.drawerAvatarText}>B</Text>
              </View>
              <View>
                <Text style={styles.drawerStoreName}>Toko Budi</Text>
                <Text style={styles.drawerStoreEmail}>admin@toko</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowBurger(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Section */}
            <Text style={styles.sectionLabel}>MENU</Text>
            {MENU_ITEMS.map((item) => {
              const isActive = currentScreen === getRouteKey(item.route);
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                  ]}
                  onPress={() => {
                    if (!isActive) {
                      router.push(item.route as any);
                    }
                    setShowBurger(false);
                  }}
                  disabled={isActive}>
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={[
                    styles.menuItemText,
                    isActive && styles.menuItemTextActive,
                  ]}>
                    {item.label}
                  </Text>
                  {isActive && (
                    <Text style={styles.activeIndicator}>●</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Back to Main */}
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
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  drawer: {
    width: '75%',
    maxWidth: 300,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 30,
  },

  // Drawer Header
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C40C7',
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  drawerAvatar: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  drawerStoreName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  drawerStoreEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  closeButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  closeButtonText: { fontSize: 18, color: '#fff' },

  // Section
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 1,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#E8D8FF',
    opacity: 0.7,
  },
  menuItemIcon: { fontSize: 20 },
  menuItemText: { fontSize: 15, color: '#333', fontWeight: '500', flex: 1 },
  menuItemTextActive: { color: '#6C40C7', fontWeight: '700' },
  activeIndicator: { fontSize: 10, color: '#6C40C7' },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  mainMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  mainMenuText: { fontSize: 15, color: '#333', fontWeight: '500' },
});