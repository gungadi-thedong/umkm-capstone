import { Stack } from 'expo-router';
import React from 'react';

export default function MenuLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="kolecsi-barang" />
      <Stack.Screen name="add-barang" />
      <Stack.Screen name="add-barang-debug" />
      <Stack.Screen name="direct-insert-test" />
      <Stack.Screen name="detail-barang" />
      <Stack.Screen name="edit-barang" />
      <Stack.Screen name="deskripsi-barang" />
      <Stack.Screen name="pemberitahuan" />
      <Stack.Screen name="search-bar" />
      <Stack.Screen name="search-dash" />
      <Stack.Screen name="test-insert" />
    </Stack>
  );
}
