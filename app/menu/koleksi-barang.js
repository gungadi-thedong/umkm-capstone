import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function KoleksiBarang() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
        const { data, error } = await supabase
          .from('barang')
          .select(`
            *,
            kategori_barang (nama_kategori)
          `)
          .order('id_barang', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        Alert.alert('Error', 'Gagal mengambil data produk');
        setProducts([]);
      } else {
        // Transform database format to component format
        const transformedProducts = data.map((item) => ({
          id_barang: item.id_barang,
          nama_barang: item.nama_barang,
          harga: item.harga,
          stok: item.stok,
          gambar: item.gambar,
          id_kategori: item.id_kategori,
          nama_kategori: item.kategori_barang?.nama_kategori || 'Tidak ada kategori',
        }));
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengambil data produk');
    } finally {
      setIsLoading(false);
    }
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

  const renderProductCard = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        {item.gambar ? (
          <Image
            source={{ uri: item.gambar }}
            style={styles.productImage}
            defaultSource={require('../../assets/images/indomie-goreng-jumbo.jpg')}
          />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Text style={styles.noImageText}>Tidak ada gambar</Text>
          </View>
        )}
      </View>
      <Text style={styles.productName}>{item.nama_barang}</Text>
      <Text style={styles.priceText}>Rp {item.harga.toLocaleString('id-ID')}</Text>
      <Text style={styles.stockText}>Stok: {item.stok}</Text>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditBarang(item)}>
        <Text style={styles.editButtonText}>Edit Barang</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E8D8FF" />
        <Text style={styles.loadingText}>Memuat produk...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tidak ada produk</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/menu/add-barang')}>
            <Text style={styles.addButtonText}>+ Tambah Produk</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id_barang.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={true}
          contentContainerStyle={styles.gridContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#E8D8FF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  noImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  noImageText: {
    fontSize: 12,
    color: '#999',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B21A8',
    marginBottom: 4,
  },
  stockText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
  },
  editButton: {
    width: '100%',
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E8D8FF',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B21A8',
  },
});
