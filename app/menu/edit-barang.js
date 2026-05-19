import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function EditBarang() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [editName, setEditName] = useState(params.name || '');
  const [editCategoryId, setEditCategoryId] = useState(params.id_kategori ? parseInt(params.id_kategori) : null);
  const [editCategoryName, setEditCategoryName] = useState(params.category || 'Pilih Kategori');
  const [editPrice, setEditPrice] = useState(params.harga ? params.harga.toString() : '');
  const [editStock, setEditStock] = useState(params.stok ? params.stok.toString() : '0');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('kategori_barang')
        .select('id_kategori, nama_kategori')
        .order('nama_kategori', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        alert('Gagal mengambil data kategori');
        setCategories([]);
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error in fetchCategories:', error);
      alert('Terjadi kesalahan saat mengambil kategori');
    } finally {
      setLoadingCategories(false);
    }
  };

  const formatPriceDisplay = (value) => {
    if (!value) return 'Rp ';
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return 'Rp ';
    return 'Rp ' + parseInt(numericValue).toLocaleString('id-ID');
  };

  const getPriceNumeric = (value) => {
    return value.replace(/\D/g, '');
  };

  const handleSelectCategory = (categoryId, categoryName) => {
    setEditCategoryId(categoryId);
    setEditCategoryName(categoryName);
    setShowCategoryModal(false);
  };

const handleSave = () => {
  if (!editName || !editPrice || !editCategoryId) {
    alert('Silakan isi semua field yang wajib diisi');
    return;
  }

  const stockValue = parseInt(editStock) || 0;
  if (stockValue < 0) {
    alert('Stok tidak boleh negatif');
    return;
  }

  if (Platform.OS === 'web') {
    const confirmed = window.confirm('Simpan perubahan produk ini?');
    if (confirmed) updateProduct();
  } else {
    Alert.alert(
      'Simpan Perubahan',
      'Apakah Anda yakin ingin menyimpan perubahan produk ini?',
      [
        { text: 'Batal', onPress: () => {}, style: 'cancel' },
        { text: 'Simpan', onPress: () => updateProduct(), style: 'default' },
      ]
    );
  }
};

  const updateProduct = async () => {
    setIsLoading(true);
    try {
      const priceNumeric = parseInt(getPriceNumeric(editPrice));
      const stockNumeric = parseInt(editStock) || 0;

      const { error } = await supabase
        .from('barang')
        .update({
          nama_barang: editName,
          harga: priceNumeric,
          stok: stockNumeric,
          id_kategori: editCategoryId,
        })
        .eq('id_barang', params.id);

      if (error) {
        console.error('Error updating product:', error);
        alert('Gagal mengupdate produk: ' + error.message);
        setIsLoading(false);
        return;
      }

      alert('Produk berhasil diupdate!');
      setIsLoading(false);
      router.replace('/menu/koleksi-barang');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Terjadi kesalahan saat menyimpan produk');
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    console.log('=== HANDLE DELETE CALLED ===');
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Apakah Anda yakin ingin menghapus produk ini?');
      if (confirmed) deleteProduct();
    } else {
      Alert.alert(
        'Hapus Produk',
        'Apakah Anda yakin ingin menghapus produk ini?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', onPress: () => deleteProduct(), style: 'destructive' },
        ]
      );
    }
  };

    const deleteProduct = async () => {
      setIsLoading(true);
      console.log('=== DELETE CALLED ===');
      console.log('params.id:', params.id);

      try {
        const { error } = await supabase
          .from('barang')
          .delete()
          .eq('id_barang', parseInt(params.id)); // ← parse jadi integer

        console.log('Delete error:', error);

        if (error) {
          alert('Gagal hapus: ' + error.message);
          setIsLoading(false);
          return;
        }

        alert('Produk berhasil dihapus!');
        setIsLoading(false);
        router.replace('/menu/koleksi-barang');
      } catch (e) {
        console.log('CATCH:', e);
        alert('Error: ' + e.message);
      }
    };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleSelectCategory(item.id_kategori, item.nama_kategori)}>
      <Text style={styles.categoryItemText}>{item.nama_kategori}</Text>
    </TouchableOpacity>
  );

  if (loadingCategories) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#E8D8FF" />
        <Text style={styles.loadingText}>Memuat kategori...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Nama Barang */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nama Barang</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukan nama produk"
              value={editName}
              onChangeText={setEditName}
            />
          </View>

          {/* Kategori - Dropdown Button */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Kategori</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryModal(true)}>
              <Text
                style={[
                  styles.categoryButtonText,
                  !editCategoryId && { color: '#999' },
                ]}>
                {editCategoryName}
              </Text>
              <Text style={styles.categoryDropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Harga */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Harga</Text>
            <TextInput
              style={styles.input}
              placeholder="Rp 0"
              value={formatPriceDisplay(editPrice)}
              onChangeText={setEditPrice}
              keyboardType="numeric"
            />
          </View>

          {/* Stok Barang */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Stok Barang</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukan jumlah stok"
              value={editStock}
              onChangeText={(value) => {
                const numericValue = value.replace(/\D/g, '');
                setEditStock(numericValue);
              }}
              keyboardType="numeric"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.ubahButton, isLoading && styles.disabledButton]} 
              onPress={handleSave}
              disabled={isLoading}>
              <Text style={styles.ubahButtonText}>
                {isLoading ? 'Menyimpan...' : 'Ubah'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.hapusButton, isLoading && styles.disabledButton]} 
              onPress={handleDelete}
              disabled={isLoading}>
              <Text style={styles.hapusButtonText}>
                {isLoading ? 'Menghapus...' : 'Hapus'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id_kategori.toString()}
              scrollEnabled={true}
            />
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  formSection: {
    backgroundColor: '#E8D8FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  categoryDropdownIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  stockController: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stockButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stockButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    minWidth: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  ubahButton: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ubahButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  hapusButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  hapusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#999',
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#000',
  },
});
