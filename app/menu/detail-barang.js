import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function DetailBarang() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const formatPrice = (price) => {
    if (!price) return 'Rp 0';
    return 'Rp ' + parseInt(price).toLocaleString('id-ID');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/menu/koleksi-barang')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Barang</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Detail Card */}
        <View style={styles.detailCard}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {params.gambar ? (
              <Image
                source={{ uri: params.gambar }}
                style={styles.productImage}
              />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Text style={styles.noImageText}>Tidak ada gambar</Text>
              </View>
            )}
          </View>

          {/* Product Details */}
          <View style={styles.detailsSection}>
            {/* Nama Barang */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Nama Barang</Text>
              <Text style={styles.detailValue}>{params.nama_barang || params.name}</Text>
            </View>

            {/* Kategori */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Kategori</Text>
              <Text style={styles.detailValue}>{params.category || 'N/A'}</Text>
            </View>

            {/* Harga */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Harga</Text>
              <Text style={styles.priceValue}>
                {formatPrice(params.harga || params.price)}
              </Text>
            </View>

            {/* Stok */}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Jumlah Stok</Text>
              <Text style={styles.stockValue}>{params.stok || params.stock} item</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cekBarangButton}
              onPress={() =>
                router.push({
                  pathname: '/menu/edit-barang',
                  params: {
                    id: params.id || params.id_barang,
                    name: params.nama_barang || params.name,
                    harga: params.harga || params.price,
                    stok: params.stok || params.stock,
                    category: params.category,
                    id_kategori: params.id_kategori,
                    gambar: params.gambar,
                  },
                })
              }>
              <Text style={styles.cekBarangText}>Cek Barang</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.transaksiButton}
              onPress={() => {
                // TODO: Navigate to transaction/sales screen
                alert('Fitur transaksi akan datang');
              }}>
              <Text style={styles.transaksiText}>Transaksi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  detailCard: {
    backgroundColor: '#E8D8FF',
    borderRadius: 16,
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 12,
  },
  noImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
  },
  detailsSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B21A8',
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cekBarangButton: {
    flex: 1,
    backgroundColor: '#FFA500',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cekBarangText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  transaksiButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  transaksiText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
