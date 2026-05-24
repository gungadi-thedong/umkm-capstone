import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, Image, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SearchBar() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('Semua');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('kategori_barang')
      .select('*')
      .order('nama_kategori');
    setCategories(data || []);
  };

  const fetchProducts = async (categoryId = null, search = '') => {
    setIsLoading(true);
    let query = supabase
      .from('barang')
      .select('*, kategori_barang(nama_kategori)')
      .order('nama_barang');

    if (categoryId) query = query.eq('id_kategori', categoryId);
    if (search.trim()) query = query.ilike('nama_barang', `%${search}%`);

    const { data } = await query;
    setProducts(data || []);
    setIsLoading(false);
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    fetchProducts(selectedCategory, text);
  };

  const handleSelectCategory = (category) => {
    if (category === null) {
      setSelectedCategory(null);
      setSelectedCategoryName('Semua');
    } else {
      setSelectedCategory(category.id_kategori);
      setSelectedCategoryName(category.nama_kategori);
    }
    setShowCategoryModal(false);
    fetchProducts(category?.id_kategori || null, searchText);
  };

  const handleSelectProduct = (item) => {
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

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.productItem} onPress={() => handleSelectProduct(item)}>
      <View style={styles.productImageBox}>
        {item.gambar ? (
          <Image source={{ uri: item.gambar }} style={styles.productImage} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>?</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productCategory}>
          {item.kategori_barang?.nama_kategori || 'Tanpa kategori'}
        </Text>
        <Text style={styles.productName}>{item.nama_barang}</Text>
        <Text style={styles.productPrice}>
          Rp {item.harga?.toLocaleString('id-ID')}
        </Text>
      </View>
      <View style={styles.productStok}>
        {item.stok === 0 ? (
          <Text style={styles.stokHabis}>Habis</Text>
        ) : (
          <Text style={styles.stokAda}>Stok: {item.stok}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Row */}
      <View style={styles.searchRow}>
        {/* Kategori Button */}
        <TouchableOpacity
          style={styles.kategoriButton}
          onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.kategoriIcon}>☰</Text>
          <Text style={styles.kategoriText} numberOfLines={1}>
            {selectedCategoryName}
          </Text>
        </TouchableOpacity>

        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Nama Barang..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearchChange}
        />
      </View>

      {/* Product List */}
      {isLoading ? (
        <ActivityIndicator size="small" color="#6C40C7" style={{ marginTop: 12 }} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id_barang.toString()}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Barang tidak ditemukan</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}>
          <View style={styles.categoryDropdown}>
            {/* Semua option */}
            <TouchableOpacity
              style={[
                styles.categoryItem,
                selectedCategory === null && styles.categoryItemActive,
              ]}
              onPress={() => handleSelectCategory(null)}>
              <Text style={[
                styles.categoryItemText,
                selectedCategory === null && styles.categoryItemTextActive,
              ]}>
                Semua
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id_kategori}
                style={[
                  styles.categoryItem,
                  selectedCategory === cat.id_kategori && styles.categoryItemActive,
                ]}
                onPress={() => handleSelectCategory(cat)}>
                <Text style={[
                  styles.categoryItemText,
                  selectedCategory === cat.id_kategori && styles.categoryItemTextActive,
                ]}>
                  {cat.nama_kategori}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  // Search Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#6C40C7',
  },
  kategoriButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    maxWidth: 110,
  },
  kategoriIcon: { fontSize: 16, color: '#fff' },
  kategoriText: { fontSize: 12, color: '#fff', fontWeight: '600', flex: 1 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },

  // Product List
  listContent: { paddingHorizontal: 16, paddingVertical: 8 },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8D8FF',
    gap: 12,
  },
  productImageBox: {
    width: 56, height: 56,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: { width: 56, height: 56, resizeMode: 'contain' },
  noImage: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  noImageText: { fontSize: 20, color: '#ccc' },
  productInfo: { flex: 1 },
  productCategory: { fontSize: 11, color: '#9966CC', fontWeight: '600', marginBottom: 2 },
  productName: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 2 },
  productPrice: { fontSize: 13, fontWeight: '600', color: '#6C40C7' },
  productStok: { alignItems: 'flex-end' },
  stokHabis: { fontSize: 11, fontWeight: '700', color: '#FF5252' },
  stokAda: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 24, fontSize: 14 },

  // Category Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingLeft: 16,
  },
  categoryDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryItemActive: { backgroundColor: '#E8D8FF' },
  categoryItemText: { fontSize: 14, color: '#333' },
  categoryItemTextActive: { color: '#6C40C7', fontWeight: '700' },
});