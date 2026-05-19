import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function AddBarang() {
  const router = useRouter();
  const [productImageUri, setProductImageUri] = useState(null); // preview lokal
  const [productImageUrl, setProductImageUrl] = useState(null); // URL setelah upload
  
  // Form State
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productImageName, setProductImageName] = useState(null);
  const [productCategoryId, setProductCategoryId] = useState(null);
  const [productCategoryName, setProductCategoryName] = useState('Pilih Kategori');

  // UI State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load categories on mount
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
        setCategories([]);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  //image
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

  //image upload
  // Upload ke Supabase Storage
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

  // Format price with Rp
  const formatPriceDisplay = (value) => {
    if (!value) return 'Rp ';
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return 'Rp ';
    return 'Rp ' + parseInt(numericValue).toLocaleString('id-ID');
  };

  // Get numeric price
  const getPriceNumeric = (value) => {
    return value.replace(/\D/g, '');
  };

  // Validate form
  const validateForm = () => {
    if (!productName || productName.trim() === '') {
      Alert.alert('Validation Error', 'Please enter product name');
      return false;
    }

    if (!productPrice || productPrice.trim() === '' || productPrice === 'Rp ') {
      Alert.alert('Validation Error', 'Please enter product price');
      return false;
    }

    if (!productStock || productStock.trim() === '') {
      Alert.alert('Validation Error', 'Please enter product stock');
      return false;
    }

    const stockNum = parseInt(productStock);
    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Validation Error', 'Stock must be a valid number');
      return false;
    }

    return true;
  };

  // Save product to database
  const saveProduct = async () => {
    setIsLoading(true);
    console.log('='.repeat(50));
    console.log('[SaveProduct] START');
    console.log('='.repeat(50));

    try {
      let gambarUrl = null;

      if (productImageUri) {
        console.log('[SaveProduct] Uploading image...');
        gambarUrl = await uploadImage(productImageUri);
        console.log('[SaveProduct] Image URL:', gambarUrl);
        if (!gambarUrl) {
          alert('Gagal upload gambar');
          setIsLoading(false);
          return;
        }
      } else {
        console.log('[SaveProduct] No image selected');
      }

      const insertData = {
        nama_barang: productName,
        harga: parseInt(getPriceNumeric(productPrice)),
        stok: parseInt(productStock) || 0,
        gambar: gambarUrl,
        id_kategori: productCategoryId || null,
      };

      console.log('[SaveProduct] Data prepared:', insertData);
      console.log('[SaveProduct] Connecting to Supabase...');

      const { data, error } = await supabase
        .from('barang')
        .insert([insertData])
        .select();

      console.log('[SaveProduct] Response received');

      if (error) {
        console.error('[SaveProduct] ERROR:', error);
        alert('Error: ' + error.message);
        return;
      }

      console.log('[SaveProduct] SUCCESS! Data:', data);
      alert('Produk berhasil disimpan!');
      router.replace('/menu/koleksi-barang');
    } catch (e) {
      console.error('[SaveProduct] EXCEPTION:', e);
      alert('Error: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle simpan button
  const handleSimpan = async () => {
    console.log('[HandleSimpan] Button pressed');

    if (!validateForm()) {
      console.log('[HandleSimpan] Validation failed');
      return;
    }

    console.log('[HandleSimpan] Validation passed, calling saveProduct directly');
    await saveProduct();
  };

  // Handle batal button
  const handleBatal = () => {
    Alert.alert('Confirm Cancel', 'Are you sure you want to cancel?', [
      {
        text: 'No',
        style: 'cancel',
      },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => router.replace('/menu/koleksi-barang'),
      },
    ]);
  };

  // Render category item in modal
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        setProductCategoryId(item.id_kategori);
        setProductCategoryName(item.nama_kategori);
        setShowCategoryModal(false);
      }}>
      <Text style={styles.categoryItemText}>{item.nama_kategori}</Text>
    </TouchableOpacity>
  );

  // Show loading while categories load
  if (loadingCategories) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6C40C7" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/menu/koleksi-barang')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Product Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              value={productName}
              onChangeText={setProductName}
              placeholderTextColor="#999"
            />
          </View>

          {/* Product Image */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Image (Optional)</Text>
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

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryModal(true)}>
              <Text
                style={[
                  styles.categoryButtonText,
                  !productCategoryId && { color: '#999' },
                ]}>
                {productCategoryName}
              </Text>
              <Text style={styles.categoryDropdownIcon}>▼</Text>
            </TouchableOpacity>
            <Text style={styles.optionalText}>(Optional)</Text>
          </View>

          {/* Price */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              placeholder="Rp 0"
              value={formatPriceDisplay(productPrice)}
              onChangeText={setProductPrice}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          {/* Stock */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Stock *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter stock quantity"
              value={productStock}
              onChangeText={(value) => {
                const numericValue = value.replace(/\D/g, '');
                setProductStock(numericValue);
              }}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.simpanButton, isLoading && styles.buttonDisabled]}
              onPress={handleSimpan}
              disabled={isLoading}
              activeOpacity={0.7}>
              <Text style={styles.buttonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.batalButton}
              onPress={handleBatal}
              disabled={isLoading}
              activeOpacity={0.7}>
              <Text style={styles.buttonText}>Cancel</Text>
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
              <Text style={styles.modalTitle}>Select Category</Text>
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

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Image</Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 24,
    padding: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#6C40C7',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  formSection: {
    backgroundColor: '#E8D8FF',
    borderRadius: 12,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  imagePickerBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9966CC',
    borderRadius: 8,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  imagePickerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: '#999',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageSelectedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  changeImageButton: {
    backgroundColor: '#6C40C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  changeImageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  categoryDropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  optionalText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  simpanButton: {
    flex: 1,
    backgroundColor: '#6C40C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  batalButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '600',
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemText: {
    fontSize: 14,
    color: '#333',
  },
  imageItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageItemThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  imageItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});
