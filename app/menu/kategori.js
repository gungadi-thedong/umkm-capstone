import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function KelolaKategori() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // State Tracker untuk Mode Edit
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // 1. AMBIL DATA KATEGORI
  const fetchCategories = async () => {
    try {
      setIsFetching(true);
      const { data, error } = await supabase
        .from('kategori_barang')
        .select('id_kategori, nama_kategori')
        .order('id_kategori', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error(error);
      alert('Gagal mengambil data kategori');
    } finally {
      setIsFetching(false);
    }
  };

  // 2. TAMBAH ATAU UPDATE DATA (Inline Action)
  const handleSave = async () => {
    if (!categoryInput.trim()) {
      alert('Nama kategori tidak boleh kosong!');
      return;
    }

    setIsLoading(true);
    try {
      if (editingId) {
        // Mode: Update Kategori yang Sudah Ada
        const { error } = await supabase
          .from('kategori_barang')
          .update({ nama_kategori: categoryInput.trim() })
          .eq('id_kategori', editingId);

        if (error) throw error;
        alert('Kategori berhasil diubah!');
      } else {
        // Mode: Tambah Kategori Baru
        const { error } = await supabase
          .from('kategori_barang')
          .insert([{ nama_kategori: categoryInput.trim() }]);

        if (error) throw error;
        alert('Kategori baru berhasil ditambahkan!');
      }

      // Reset Form & Refresh Data
      setCategoryInput('');
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      alert('Aksi gagal: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. AKTIFKAN MODE EDIT (Oper data ke input atas)
  const startEdit = (item) => {
    setEditingId(item.id_kategori);
    setCategoryInput(item.nama_kategori);
  };

  // 4. BATALKAN MODE EDIT
  const cancelEdit = () => {
    setEditingId(null);
    setCategoryInput('');
  };

  // 5. HAPUS KATEGORI
  const handleDelete = (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Hapus kategori ini? Barang dengan kategori ini mungkin akan kehilangan hubungannya.');
      if (confirmed) deleteCategory(id);
    } else {
      Alert.alert(
        'Hapus Kategori',
        'Apakah Anda yakin ingin menghapus kategori ini?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', onPress: () => deleteCategory(id), style: 'destructive' },
        ]
      );
    }
  };

  const deleteCategory = async (id) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('kategori_barang')
        .delete()
        .eq('id_kategori', id);

      if (error) throw error;
      alert('Kategori berhasil dihapus!');
      
      if (editingId === id) cancelEdit(); // Reset jika sedang di-edit
      fetchCategories();
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // RENDER ROW LIST KATEGORI
  const renderItem = ({ item }) => (
    <View style={styles.categoryRow}>
      <Text style={styles.categoryName}>{item.nama_kategori}</Text>
      
      <View style={styles.actionContainer}>
        {/* Tombol Edit */}
        <TouchableOpacity style={styles.editButton} onPress={() => startEdit(item)}>
          <Text style={styles.buttonTextEmoji}>✏️</Text>
        </TouchableOpacity>

        {/* Tombol Hapus */}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id_kategori)}>
          <Text style={styles.buttonTextEmoji}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* INPUT FORM (Bisa jadi form Tambah / Edit) */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>
          {editingId ? 'Ubah Nama Kategori' : 'Tambah Kategori Baru'}
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Makanan, Elektronik..."
            value={categoryInput}
            onChangeText={setCategoryInput}
            disabled={isLoading}
          />
          <TouchableOpacity 
            style={[styles.saveButton, editingId && styles.btnOrange]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? '...' : editingId ? 'Simpan' : 'Tambah'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tombol Batal Keluar kalau lagi di Mode Edit */}
        {editingId && (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
            <Text style={styles.cancelButtonText}>Batal Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LIST KATEGORI */}
      {isFetching ? (
        <ActivityIndicator size="large" color="#6C40C7" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_kategori.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Belum ada kategori yang dibuat.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  
  // Input Form Component
  inputCard: { backgroundColor: '#E8D8FF', padding: 16, margin: 16, borderRadius: 12 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#ddd' },
  saveButton: { backgroundColor: '#6C40C7', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  btnOrange: { backgroundColor: '#E67E22' },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelButton: { marginTop: 8, alignSelf: 'flex-start' },
  cancelButtonText: { color: '#FF4444', fontSize: 13, fontWeight: '600' },

  // List Component
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  categoryName: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1 },
  actionContainer: { flexDirection: 'row', gap: 12 },
  editButton: { padding: 6, backgroundColor: '#FFF9E6', borderRadius: 6, borderWidth: 1, borderColor: '#F1C40F' },
  deleteButton: { padding: 6, backgroundColor: '#FFECEC', borderRadius: 6, borderWidth: 1, borderColor: '#FF4444' },
  buttonTextEmoji: { fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#999', fontSize: 14 }
});