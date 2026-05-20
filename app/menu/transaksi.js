import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function MenuTransaksi() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cartItems, setCartItems] = useState([]);

  //custom search
const [searchResults, setSearchResults] = useState([]);
const [showSearchDropdown, setShowSearchDropdown] = useState(false);
const [searchLoading, setSearchLoading] = useState(false);

  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Totals
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.total, 0);
  const paymentNum = parseInt(paymentAmount.replace(/\D/g, '')) || 0;
  const kembalian = paymentNum - totalPrice;

  const formatCurrency = (value) => {
    const numValue = parseInt(value.toString().replace(/\D/g, '')) || 0;
    return numValue.toLocaleString('id-ID');
  };


    // Fetch semua produk saat fokus
    const handleSearchFocus = async () => {
    setShowSearchDropdown(true);
    setSearchLoading(true);
    const { data } = await supabase
        .from('barang')
        .select('*, kategori_barang(nama_kategori)')
        .limit(7);
    setSearchResults(data || []);
    setSearchLoading(false);
    };

    // Live filter saat ketik
    const handleSearchChange = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
        handleSearchFocus();
        return;
    }
    setSearchLoading(true);

    // Query by nama_barang dulu
    const { data: byNama } = await supabase
        .from('barang')
        .select('*, kategori_barang(nama_kategori)')
        .ilike('nama_barang', `%${text}%`)
        .limit(10);

    // Query by kategori
    const { data: kategoriData } = await supabase
        .from('kategori_barang')
        .select('id_kategori')
        .ilike('nama_kategori', `%${text}%`);

    let combined = [...(byNama || [])];

    if (kategoriData && kategoriData.length > 0) {
        const kategoriIds = kategoriData.map(k => k.id_kategori);
        const { data: byKategori } = await supabase
        .from('barang')
        .select('*, kategori_barang(nama_kategori)')
        .in('id_kategori', kategoriIds)
        .limit(10);

        // Merge, hindari duplikat
        const existingIds = new Set(combined.map(i => i.id_barang));
        (byKategori || []).forEach(item => {
        if (!existingIds.has(item.id_barang)) combined.push(item);
        });
    }

    setSearchResults(combined);
    setSearchLoading(false);
    };

    // Pilih dari dropdown
    const handleSelectFromDropdown = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowSearchDropdown(false);
    setSearchText(product.nama_barang);
    setShowDetailModal(true);
    };

  // Search barang dari DB saat Enter
//   const handleSearch = async () => {
//     if (!searchText.trim()) return;

//     const { data, error } = await supabase
//       .from('barang')
//       .select('*, kategori_barang(nama_kategori)')
//       .ilike('nama_barang', `%${searchText}%`)
//       .limit(1)
//       .single();

//     if (error || !data) {
//       alert('Barang tidak ditemukan!');
//       return;
//     }

//     setSelectedProduct(data);
//     setQuantity(1);
//     setShowDetailModal(true);
//   };

  // Masukkan barang ke cart
  const handleMasukkanBarang = () => {
    if (!selectedProduct) return;

    const existing = cartItems.find(item => item.id_barang === selectedProduct.id_barang);

    if (existing) {
      // Update quantity kalau udah ada
      setCartItems(cartItems.map(item =>
        item.id_barang === selectedProduct.id_barang
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.unitPrice }
          : item
      ));
    } else {
      // Tambah baru
      setCartItems([...cartItems, {
        id_barang: selectedProduct.id_barang,
        name: selectedProduct.nama_barang,
        unitPrice: selectedProduct.harga,
        quantity: quantity,
        total: quantity * selectedProduct.harga,
      }]);
    }

    setShowDetailModal(false);
    setSearchText('');
    setSelectedProduct(null);
    setQuantity(1);
  };

    const handleSimpanTransaksi = async () => {
    if (cartItems.length === 0) {
        alert('Keranjang kosong!');
        return;
    }
    if (paymentNum < totalPrice) {
        alert('Jumlah bayar kurang!');
        return;
    }

    const doSave = async () => {
        try {
        // 1. Insert ke transaksi dulu
        const { data: transaksiData, error: transaksiError } = await supabase
            .from('transaksi')
            .insert([{
            jumlah_barang: totalItems,
            total_penjualan: totalPrice,
            jumlah_bayar: paymentNum,
            kembalian: kembalian,
            }])
            .select()
            .single();

        if (transaksiError) {
            alert('Gagal simpan transaksi: ' + transaksiError.message);
            return;
        }

        const id_transaksi = transaksiData.id_transaksi;
        console.log('Transaksi created, id:', id_transaksi);

        // 2. Insert detail_transaksi per item
        const detailRows = cartItems.map(item => ({
            id_transaksi: id_transaksi,
            id_barang: item.id_barang,
            jumlah_beli: item.quantity,
            total_beli: item.total,
        }));

        const { error: detailError } = await supabase
            .from('detail_transaksi')
            .insert(detailRows);

        if (detailError) {
            alert('Transaksi tersimpan tapi detail gagal: ' + detailError.message);
            return;
        }

        console.log('Detail transaksi inserted:', detailRows.length, 'rows');
        alert('Transaksi berhasil disimpan!');

        // Reset
        setCartItems([]);
        setPaymentAmount('');
        setSearchText('');

        } catch (e) {
        alert('Error: ' + e.message);
        }
    };

    if (Platform.OS === 'web') {
        const confirmed = window.confirm('Simpan transaksi ini?');
        if (confirmed) await doSave();
    } else {
        Alert.alert('Simpan Transaksi', 'Apakah Anda yakin?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya', onPress: doSave },
        ]);
    }
    };

  const handleBatalTransaksi = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Batalkan transaksi ini?');
      if (confirmed) router.replace('/menu/koleksi-barang');
    } else {
      Alert.alert('Batalkan', 'Yakin batalkan transaksi?', [
        { text: 'Tidak', style: 'cancel' },
        { text: 'Ya', onPress: () => router.replace('/menu/koleksi-barang'), style: 'destructive' },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Transaksi</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
        <TextInput
            style={styles.searchInput}
            placeholder="Cari barang atau kategori..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            returnKeyType="search"
        />

        {/* Dropdown */}
        {showSearchDropdown && (
            <View style={styles.dropdown}>
            {searchLoading ? (
                <Text style={styles.dropdownLoading}>Mencari...</Text>
            ) : searchResults.length === 0 ? (
                <Text style={styles.dropdownEmpty}>Barang tidak ditemukan</Text>
            ) : (
                searchResults.map((item) => (
                <TouchableOpacity
                    key={item.id_barang}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectFromDropdown(item)}>
                    {/* Gambar mini */}
                    <View style={styles.dropdownImageBox}>
                    {item.gambar ? (
                        <Image source={{ uri: item.gambar }} style={styles.dropdownImage} />
                    ) : (
                        <View style={styles.dropdownNoImage}>
                        <Text style={styles.dropdownNoImageText}>?</Text>
                        </View>
                    )}
                    </View>
                    {/* Info */}
                    <View style={styles.dropdownInfo}>
                    <Text style={styles.dropdownName}>{item.nama_barang}</Text>
                    <Text style={styles.dropdownCategory}>
                        {item.kategori_barang?.nama_kategori || 'Tanpa kategori'}
                    </Text>
                    </View>
                    {/* Harga */}
                    <Text style={styles.dropdownPrice}>
                    Rp {item.harga?.toLocaleString('id-ID')}
                    </Text>
                </TouchableOpacity>
                ))
            )}
            </View>
        )}
        </View>

        {/* Cart Table */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Nama Barang</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Harga Satuan</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Harga Total</Text>
          </View>

          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada barang ditambahkan</Text>
          ) : (
            cartItems.map((item) => (
              <View key={item.id_barang} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {item.name} x{item.quantity}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))
          )}

          <View style={styles.divider} />

          {/* Summary */}
          <View style={styles.summaryRow}>
            <Text style={styles.colLabel}>Total Item</Text>
            <Text style={styles.colValue}>{totalItems}</Text>
            <Text style={styles.colValue}>{formatCurrency(totalPrice)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.colLabel}>Total Bayar</Text>
            <TextInput
              style={styles.paymentInput}
              placeholder="Masukkan nominal"
              placeholderTextColor="#999"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.colLabel}>Kembalian</Text>
            <View style={{ flex: 1 }} />
            <Text style={[styles.colValue, { color: '#6C40C7', fontWeight: '700' }]}>
              {formatCurrency(Math.max(0, kembalian))}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons - Fixed */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.batalButton} onPress={handleBatalTransaksi}>
          <Text style={styles.batalButtonText}>Batal Transaksi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.simpanButton} onPress={handleSimpanTransaksi}>
          <Text style={styles.simpanButtonText}>Simpan Transaksi</Text>
        </TouchableOpacity>
      </View>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Detail Insert</Text>

            {selectedProduct && (
              <>
                {/* Product Info */}
                <View style={styles.modalProductRow}>
                  {/* Gambar */}
                  <View style={styles.modalImageBox}>
                    {selectedProduct.gambar ? (
                      <Image
                        source={{ uri: selectedProduct.gambar }}
                        style={styles.modalImage}
                      />
                    ) : (
                      <Text style={styles.modalNoImage}>Gambar barang disini</Text>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.modalProductInfo}>
                    <Text style={styles.modalProductName}>{selectedProduct.nama_barang}</Text>
                    <View style={styles.modalPriceRow}>
                      <Text style={styles.modalPriceLabel}>Harga</Text>
                      <Text style={styles.modalPriceValue}>{formatCurrency(selectedProduct.harga)}</Text>
                    </View>
                  </View>
                </View>

                {/* Quantity */}
                <Text style={styles.modalQtyLabel}>Masukkan jumlah</Text>
                <View style={styles.modalQtyRow}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Text style={styles.qtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.qtyInput}
                    value={quantity.toString()}
                    onChangeText={(v) => setQuantity(parseInt(v.replace(/\D/g, '')) || 1)}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setQuantity(quantity + 1)}>
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Buttons */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalBatalButton}
                onPress={() => {
                  setShowDetailModal(false);
                  setSelectedProduct(null);
                  setQuantity(1);
                }}>
                <Text style={styles.modalBatalText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalMasukkanButton}
                onPress={handleMasukkanBarang}>
                <Text style={styles.modalMasukkanText}>Masukkan barang</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#E8D8FF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#D4B5F5',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#333', textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  searchContainer: { marginBottom: 16 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8D8FF',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  tableHeaderCell: { fontSize: 12, fontWeight: '700', color: '#333' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tableCell: { fontSize: 13, color: '#333' },
  emptyText: { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 16 },
  divider: { height: 2, backgroundColor: '#333', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  colLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: '#333' },
  colValue: { flex: 1, fontSize: 13, fontWeight: '600', color: '#333', textAlign: 'center' },
  paymentInput: {
    flex: 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8D8FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#333',
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8D8FF',
    borderTopWidth: 1,
    borderTopColor: '#D4B5F5',
    gap: 12,
  },
  batalButton: { flex: 1, backgroundColor: '#FF5252', paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  batalButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  simpanButton: { flex: 1, backgroundColor: '#4CAF50', paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  simpanButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: {
    backgroundColor: '#E8D8FF',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 16 },
  modalProductRow: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 12, padding: 12, marginBottom: 16, gap: 12 },
  modalImageBox: {
    width: 100, height: 100, backgroundColor: '#fff',
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  modalImage: { width: 100, height: 100, borderRadius: 8, resizeMode: 'contain' },
  modalNoImage: { fontSize: 11, color: '#999', textAlign: 'center', padding: 8 },
  modalProductInfo: { flex: 1, justifyContent: 'center', gap: 8 },
  modalProductName: { fontSize: 18, fontWeight: '700', color: '#333' },
  modalPriceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalPriceLabel: { fontSize: 14, color: '#666' },
  modalPriceValue: { fontSize: 14, fontWeight: '600', color: '#6C40C7' },
  modalQtyLabel: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 12 },
  modalQtyRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 20 },
  qtyButton: {
    width: 40, height: 40, backgroundColor: '#fff',
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  qtyButtonText: { fontSize: 20, fontWeight: '700', color: '#333' },
  qtyInput: {
    width: 60, height: 40, backgroundColor: '#fff',
    borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0',
    fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center',
  },
  modalButtonRow: { flexDirection: 'row', gap: 12 },
  modalBatalButton: { flex: 1, backgroundColor: '#FF5252', paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
  modalBatalText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  modalMasukkanButton: { flex: 1, backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
  modalMasukkanText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  searchWrapper: { marginBottom: 16, zIndex: 999 },
    dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8D8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
    },
    dropdownLoading: { padding: 16, color: '#999', textAlign: 'center' },
    dropdownEmpty: { padding: 16, color: '#999', textAlign: 'center' },
    dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 10,
    },
    dropdownImageBox: {
    width: 40, height: 40,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    },
    dropdownImage: { width: 40, height: 40, resizeMode: 'contain' },
    dropdownNoImage: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    dropdownNoImageText: { fontSize: 18, color: '#ccc' },
    dropdownInfo: { flex: 1 },
    dropdownName: { fontSize: 13, fontWeight: '600', color: '#333' },
    dropdownCategory: { fontSize: 11, color: '#999', marginTop: 2 },
    dropdownPrice: { fontSize: 13, fontWeight: '700', color: '#6C40C7' },
});