import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function Pemberitahuan() {
  const router = useRouter();
  const [products, setProducts] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchLowStock();
    }, [])
  );

  const fetchLowStock = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('barang')
      .select('*, kategori_barang(nama_kategori)')
      .lte('stok', 10) // kurang dari atau sama dengan 10
      .order('stok', { ascending: true }); // yang paling habis duluan

    if (error) {
      console.error('Error:', error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const handleEditBarang = (item) => {
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

  const getCardStyle = (stok) => {
    if (stok === 0) return styles.cardHabis;
    return styles.cardMenipis;
  };

  const getStatusText = (stok) => {
    if (stok === 0) return 'STOK HABIS';
    return `Stok menipis: ${stok}`;
  };

  const getStatusStyle = (stok) => {
    if (stok === 0) return styles.statusHabis;
    return styles.statusMenipis;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, getCardStyle(item.stok)]}>
      {/* Gambar */}
      <View style={styles.imageBox}>
        {item.gambar ? (
          <Image source={{ uri: item.gambar }} style={styles.image} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>?</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.kategori}>
          {item.kategori_barang?.nama_kategori || 'Tanpa kategori'}
        </Text>
        <Text style={[
          styles.nama,
          item.stok === 0 && { color: '#FF5252' }
        ]}>
          {item.nama_barang}
        </Text>
        <Text style={[
          styles.harga,
          item.stok === 0 && { color: '#FF5252' }
        ]}>
          Harga: Rp {item.harga?.toLocaleString('id-ID')}
        </Text>
        <Text style={getStatusStyle(item.stok)}>
          {getStatusText(item.stok)}
        </Text>
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditBarang(item)}>
        <Text style={styles.editButtonText}>Restock</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C40C7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>Semua stok aman!</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_barang.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 2,
  },
  cardMenipis: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFA000',
  },
  cardHabis: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF5252',
  },

  imageBox: {
    width: 60, height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: { width: 60, height: 60, resizeMode: 'contain' },
  noImage: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  noImageText: { fontSize: 22, color: '#ccc' },

  info: { flex: 1 },
  kategori: { fontSize: 11, color: '#9966CC', fontWeight: '600', marginBottom: 2 },
  nama: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 2 },
  harga: { fontSize: 12, color: '#555', marginBottom: 4 },

  statusMenipis: {
    fontSize: 12, fontWeight: '700', color: '#FFA000',
  },
  statusHabis: {
    fontSize: 12, fontWeight: '700', color: '#FF5252',
  },

  editButton: {
    backgroundColor: '#6C40C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#999', fontWeight: '600' },
});