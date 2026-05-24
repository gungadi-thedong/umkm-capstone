import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// 1. KUNCI SPLASH SCREEN: Tahan layar loading logo bawaan HP biar ga bocor
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  // 2. SISTEM PROTEKSI ROUTE SEBELUM LAYAR TERBUKA
  useEffect(() => {
    const proteksiRuteAwal = async () => {
      try {
        const simpananId = await AsyncStorage.getItem('user_id');
        const sedangDiGrupMenu = segments[0] === 'menu';

        if (!simpananId && sedangDiGrupMenu) {
          // Kasus Expo Go maksa masuk katalog padahal udah logout -> Tendang paksa ke Login (/)
          router.replace('/');
        } else if (simpananId && !sedangDiGrupMenu) {
          // Ada session aktif -> Auto bypass langsung masuk katalog utama
          router.replace('/menu/koleksi-barang');
        }
      } catch (e) {
        console.log('Gagal cek rute awal root:', e);
      } finally {
        // Pengecekan kelar, buka kunci status ready, lalu lepas Splash Screen HP
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    proteksiRuteAwal();
  }, [segments]);

  // Jika pengecekan storage belum selesai, render kosong (ditutup full oleh Splash Screen)
  if (!isReady) {
    return null; 
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Cukup daftarkan index (Login) saja, folder 'menu' gak perlu ditulis manual karena udah otomatis */}
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
  }