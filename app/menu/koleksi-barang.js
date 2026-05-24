import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, FlatList, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function KoleksiBarang() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchProducts(), fetchLowStock()]);
    setIsLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('barang')
      .select('*, kategori_barang(nama_kategori)')
      .order('id_barang', { ascending: false })
      .limit(10);
    setProducts(data?.map(item => ({
      id_barang: item.id_barang,
      nama_barang: item.nama_barang,
      harga: item.harga,
      stok: item.stok,
      gambar: item.gambar,
      id_kategori: item.id_kategori,
      nama_kategori: item.kategori_barang?.nama_kategori || 'Tanpa kategori',
    })) || []);
  };

  const fetchLowStock = async () => {
    const { data } = await supabase
      .from('barang')
      .select('*, kategori_barang(nama_kategori)')
      .lte('stok', 10)
      .order('stok', { ascending: true })
      .limit(6);
    setLowStockProducts(data || []);
  };

  const handleEditBarang = (item) => {
    router.push({
      pathname: '/menu/detail-barang',
      params: {
        id: item.id_barang,
        id_barang: item.id_barang,
        nama_barang: item.nama_barang,
        name: item.nama_barang,
        harga: item.harga.toString(),
        stok: item.stok.toString(),
        gambar: item.gambar || '',
        id_kategori: item.id_kategori?.toString() || '',
        category: item.nama_kategori,
      },
    });
  };

  const handlePemberitahuanPress = (item) => {
    router.push({
      pathname: '/menu/detail-barang',
      params: {
        id: item.id_barang,
        id_barang: item.id_barang,
        nama_barang: item.nama_barang,
        name: item.nama_barang,
        harga: item.harga?.toString(),
        stok: item.stok?.toString(),
        gambar: item.gambar || '',
        id_kategori: item.id_kategori?.toString() || '',
        category: item.kategori_barang?.nama_kategori || '',
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Purple Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerLabel}>KATALOG</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>UTAMA</Text>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/menu/search-bar')}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Nama Barang...</Text>
        </TouchableOpacity>

        {/* Tambah Barang Button */}
        <TouchableOpacity
          style={styles.tambahButton}
          onPress={() => router.push('/menu/add-barang')}>
          <Text style={styles.tambahButtonText}>+ Tambah Barang</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Pemberitahuan Section */}
        {lowStockProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pemberitahuan</Text>
              <TouchableOpacity onPress={() => router.push('/menu/pemberitahuan')}>
                <Text style={styles.lihatSelengkapnya}>
                  Lihat Selengkapnya ({lowStockProducts.length}) →
                </Text>
              </TouchableOpacity>
            </View>

            {lowStockProducts.map((item) => (
              <TouchableOpacity
                key={item.id_barang}
                style={[
                  styles.notifCard,
                  item.stok === 0 ? styles.notifHabis : styles.notifMenipis,
                ]}
                onPress={() => handlePemberitahuanPress(item)}>
                {/* Gambar */}
                <View style={styles.notifImageBox}>
                  {item.gambar ? (
                    <Image source={{ uri: item.gambar }} style={styles.notifImage} />
                  ) : (
                    <Text style={styles.notifNoImage}>?</Text>
                  )}
                </View>
                {/* Info */}
                <View style={styles.notifInfo}>
                  <Text style={[
                    styles.notifName,
                    item.stok === 0 && { color: '#FF5252' }
                  ]}>
                    {item.nama_barang}
                  </Text>
                  <Text style={[
                    styles.notifPrice,
                    item.stok === 0 && { color: '#FF5252' }
                  ]}>
                    Harga: Rp {item.harga?.toLocaleString('id-ID')}
                  </Text>
                  <Text style={item.stok === 0 ? styles.notifStatusHabis : styles.notifStatusMenipis}>
                    {item.stok === 0 ? 'stok habis' : `stok menipis: ${item.stok}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Koleksi Barang Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Koleksi Barang</Text>
            <TouchableOpacity onPress={() => router.push('/menu/search-bar')}>
              <Text style={styles.lihatSelengkapnya}>
                Lihat Selengkapnya ({products.length}) →
              </Text>
            </TouchableOpacity>
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Belum ada produk</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/menu/add-barang')}>
                <Text style={styles.addButtonText}>+ Tambah Produk</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.grid}>
              {products.map((item) => (
                <View key={item.id_barang} style={styles.productCard}>
                  <View style={styles.imageContainer}>
                    {item.gambar ? (
                      <Image source={{ uri: item.gambar }} style={styles.productImage} />
                    ) : (
                      <View style={styles.noImagePlaceholder}>
                        <Text style={styles.noImageText}>?</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productCategory}>{item.nama_kategori}</Text>
                  <Text style={styles.productName}>{item.nama_barang}</Text>
                  <Text style={styles.priceText}>
                    Rp {item.harga.toLocaleString('id-ID')}
                  </Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditBarang(item)}>
                    <Text style={styles.editButtonText}>Edit Barang</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: {
    flex: 1, backgroundColor: '#6C40C7',
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 14 },

  // Header
  header: {
    backgroundColor: '#6C40C7',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 12, fontWeight: '600',
    color: 'rgba(255,255,255,0.7)', letterSpacing: 2,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerTitle: {
    fontSize: 36, fontWeight: '900',
    color: '#fff', marginBottom: 16, letterSpacing: 1,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 10, gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { fontSize: 14, color: '#999' },
  tambahButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tambahButtonText: {
    fontSize: 14, fontWeight: '700', color: '#6C40C7',
  },

  // Content
  content: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#333',
  },
  lihatSelengkapnya: {
    fontSize: 12, fontWeight: '600', color: '#6C40C7',
  },

  // Notif Cards
  notifCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 10, marginBottom: 8,
    borderWidth: 1.5, gap: 10,
  },
  notifMenipis: { backgroundColor: '#FFF8E1', borderColor: '#FFA000' },
  notifHabis: { backgroundColor: '#FFEBEE', borderColor: '#FF5252' },
  notifImageBox: {
    width: 52, height: 52, borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  notifImage: { width: 52, height: 52, resizeMode: 'contain' },
  notifNoImage: { fontSize: 20, color: '#ccc' },
  notifInfo: { flex: 1 },
  notifName: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 2 },
  notifPrice: { fontSize: 11, color: '#555', marginBottom: 2 },
  notifStatusMenipis: { fontSize: 11, fontWeight: '700', color: '#FFA000' },
  notifStatusHabis: { fontSize: 11, fontWeight: '700', color: '#FF5252' },

  // Product Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '47%',
    backgroundColor: '#E8D8FF',
    borderRadius: 16, padding: 12, alignItems: 'center',
  },
  imageContainer: {
    width: '100%', height: 110,
    backgroundColor: '#F0F0F0', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  productImage: { width: 90, height: 90, resizeMode: 'contain' },
  noImagePlaceholder: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  noImageText: { fontSize: 24, color: '#ccc' },
  productCategory: {
    fontSize: 10, fontWeight: '600',
    color: '#9966CC', marginBottom: 2, textAlign: 'center',
  },
  productName: {
    fontSize: 13, fontWeight: '700',
    color: '#000', marginBottom: 4, textAlign: 'center',
  },
  priceText: {
    fontSize: 11, fontWeight: '600',
    color: '#6B21A8', marginBottom: 8,
  },
  editButton: {
    width: '100%', paddingVertical: 7,
    backgroundColor: '#F5F5F5', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  editButtonText: { fontSize: 11, fontWeight: '600', color: '#666' },

  emptyContainer: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, color: '#999', marginBottom: 12 },
  addButton: {
    paddingVertical: 10, paddingHorizontal: 20,
    backgroundColor: '#E8D8FF', borderRadius: 8,
  },
  addButtonText: { fontSize: 13, fontWeight: '600', color: '#6B21A8' },
});