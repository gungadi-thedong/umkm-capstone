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
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function EditBarang() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [editName, setEditName] = useState(params.name || '');
  const [editCategoryId, setEditCategoryId] = useState(params.id_kategori ? parseInt(params.id_kategori) : null);
  const [editCategoryName, setEditCategoryName] = useState(params.category || 'Pilih Kategori');
  const [editPrice, setEditPrice] = useState(params.harga ? params.harga.toString() : '');
  const [editStock, setEditStock] = useState(params.stok ? params.stok.toString() : '0');
  const [productImageUri, setProductImageUri] = useState(params.gambar || null); // Simpan preview/URL gambar

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (params.id) {
      fetchProductDetails();
    }
  }, []);

  const fetchProductDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('barang')
        .select('*')
        .eq('id_barang', parseInt(params.id))
        .single();
        
      if (data) {
        setEditName(data.nama_barang || '');
        setEditPrice(data.harga ? data.harga.toString() : '');
        setEditStock(data.stok ? data.stok.toString() : '0');
        setEditCategoryId(data.id_kategori);
        setProductImageUri(data.gambar || null);

        if (data.id_kategori) {
          const { data: catData } = await supabase
            .from('kategori_barang')
            .select('nama_kategori')
            .eq('id_kategori', data.id_kategori)
            .single();
          if (catData) setEditCategoryName(catData.nama_kategori);
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

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

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProductImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const filename = `barang_${Date.now()}.jpg`;
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('barang-images')
      .upload(filename, blob, { contentType: 'image/jpeg' });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('barang-images')
      .getPublicUrl(filename);

    return data.publicUrl;
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

      let gambarUrl = productImageUri;
      // Jika mendeteksi uri lokal baru (bukan link http dari supabase storage), lakukan upload ulang
      if (productImageUri && !productImageUri.startsWith('http')) {
        gambarUrl = await uploadImage(productImageUri);
        if (!gambarUrl) {
          alert('Gagal upload gambar');
          setIsLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('barang')
        .update({
          nama_barang: editName,
          harga: priceNumeric,
          stok: stockNumeric,
          id_kategori: editCategoryId,
          gambar: gambarUrl,
        })
        .eq('id_barang', parseInt(params.id));

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
    try {
      const { error } = await supabase
        .from('barang')
        .delete()
        .eq('id_barang', parseInt(params.id));

      if (error) {
        alert('Gagal hapus: ' + error.message);
        setIsLoading(false);
        return;
      }

      alert('Produk berhasil dihapus!');
      setIsLoading(false);
      router.replace('/menu/koleksi-barang');
    } catch (e) {
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
      <ScrollView 
      style={styles.content} 
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
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

          {/* Gambar Produk */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Gambar Produk (Opsional)</Text>
            {productImageUri ? (
              <View>
                <Image source={{ uri: productImageUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.changeImageButton} onPress={handleSelectImage}>
                  <Text style={styles.changeImageButtonText}>Ganti Gambar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePickerBox} onPress={handleSelectImage}>
                <Text style={styles.imagePickerIcon}>📸</Text>
                <Text style={styles.imagePickerText}>Tap untuk pilih gambar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Kategori */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Kategori</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryModal(true)}>
              <Text style={[styles.categoryButtonText, !editCategoryId && { color: '#999' }]}>
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
                      <TouchableOpacity
              style={[styles.backButton, isLoading && styles.disabledButton]} 
              onPress={() => router.replace('/menu/koleksi-barang')}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>
                {isLoading ? 'Memuat...' : 'Kembali ke Katalog'}
              </Text>
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  formSection: { backgroundColor: '#E8D8FF', borderRadius: 16, padding: 16, marginTop: 20 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 },
  input: { backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  categoryButton: { backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryButtonText: { fontSize: 14, color: '#000', flex: 1 },
  categoryDropdownIcon: { fontSize: 12, color: '#666', marginLeft: 8 },
  buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  ubahButton: { flex: 1, backgroundColor: '#000', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ubahButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  hapusButton: { flex: 1, backgroundColor: '#FF4444', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  hapusButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  disabledButton: { opacity: 0.6 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#999' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', // Mengubah posisi ke tengah vertikal
    alignItems: 'center',       // Mengubah posisi ke tengah horizontal
  },
  modalContent: { // atau modalCard tergantung penamaan di file Anda
    backgroundColor: '#fff',
    borderRadius: 16,           // Membuat sudut membulat di semua sisi (bukan cuma atas)
    width: '85%',               // Membatasi lebar agar proporsional di HP maupun Web
    maxWidth: 420,              // Batas maksimal lebar di layar Web agar tidak terlalu melar
    maxHeight: '85%',           // Mencegah modal melebihi tinggi layar HP
    padding: 20,                // Memberikan jarak dalam yang rapi
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  modalCloseButton: { fontSize: 24, color: '#999' },
  categoryItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  categoryItemText: { fontSize: 16, color: '#000' },
  imagePickerBox: { borderWidth: 1, borderColor: '#9966CC', borderRadius: 8, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  imagePickerIcon: { fontSize: 28, marginBottom: 4 },
  imagePickerText: { fontSize: 13, fontWeight: '600', color: '#333' },
  previewImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 8, resizeMode: 'cover' },
  changeImageButton: { backgroundColor: '#6C40C7', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  changeImageButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  backButton: {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#6C40C7', // Ungu utama layout
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 12,
},
backButtonText: {
  color: '#6C40C7',
  fontSize: 14,
  fontWeight: '700',
},
disabledButton: {
  backgroundColor: '#F5F5F5',
  borderColor: '#E0E0E0',
  opacity: 0.7,
},
});