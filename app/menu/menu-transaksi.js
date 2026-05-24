import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, Alert, Platform, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

const formatTanggal = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const dd = String(wibDate.getUTCDate()).padStart(2, '0');
  const mm = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = wibDate.getUTCFullYear();
  const jam = String(wibDate.getUTCHours()).padStart(2, '0');
  const menit = String(wibDate.getUTCMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${jam}:${menit}`;
};

const formatTanggalHari = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const dd = String(wibDate.getUTCDate()).padStart(2, '0');
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const mm = months[wibDate.getUTCMonth()];
  const yyyy = wibDate.getUTCFullYear();
  return `${dd} ${mm} ${yyyy}`;
};

const getDateKey = (isoString) => {
  const date = new Date(isoString);
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return `${wibDate.getUTCFullYear()}-${String(wibDate.getUTCMonth()+1).padStart(2,'0')}-${String(wibDate.getUTCDate()).padStart(2,'0')}`;
};

export default function RiwayatTransaksi() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState('harian'); // 'harian' | 'semua'
  const [transaksiList, setTransaksiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchTransaksi();
    }, [])
  );

  const fetchTransaksi = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('transaksi')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', 'Gagal mengambil data transaksi');
      setTransaksiList([]);
    } else {
      setTransaksiList(data || []);
    }
    setIsLoading(false);
  };

  // Group by hari
  const groupByHari = () => {
    const groups = {};
    transaksiList.forEach(t => {
      const key = getDateKey(t.created_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups).map(([date, items]) => ({
      date,
      label: formatTanggalHari(items[0].created_at),
      totalTransaksi: items.length,
      totalBarang: items.reduce((s, i) => s + (i.jumlah_barang || 0), 0),
      totalPendapatan: items.reduce((s, i) => s + (i.total_penjualan || 0), 0),
      transaksiIds: items.map(i => i.id_transaksi),
    }));
  };

  // Fetch detail untuk modal
  const fetchDetail = async (transaksiIds, title) => {
    setDetailLoading(true);
    setDetailTitle(title);
    setShowDetail(true);

    const { data, error } = await supabase
      .from('detail_transaksi')
      .select('*, barang(nama_barang, harga, gambar)')
      .in('id_transaksi', transaksiIds);

    if (error) {
      Alert.alert('Error', 'Gagal mengambil detail');
      setDetailData(null);
    } else {
      // Fetch transaksi info
      const { data: transaksiData } = await supabase
        .from('transaksi')
        .select('*')
        .in('id_transaksi', transaksiIds);

      setDetailData({ items: data || [], transaksi: transaksiData || [] });
    }
    setDetailLoading(false);
  };

  const handleHapus = (transaksiIds, label) => {
    const doHapus = async () => {
      const { error } = await supabase
        .from('transaksi')
        .delete()
        .in('id_transaksi', transaksiIds);

      if (error) {
        alert('Gagal hapus: ' + error.message);
        return;
      }
      alert('Transaksi berhasil dihapus!');
      fetchTransaksi();
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Hapus transaksi ${label}?`);
      if (confirmed) doHapus();
    } else {
      Alert.alert('Hapus', `Hapus transaksi ${label}?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', onPress: doHapus, style: 'destructive' },
      ]);
    }
  };

  const hariGroups = groupByHari();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6C40C7" />
        <Text style={styles.loadingText}>Memuat transaksi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>

        {/* Toggle Button */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'harian' && styles.toggleActive]}
            onPress={() => setViewMode('harian')}>
            <Text style={[styles.toggleText, viewMode === 'harian' && styles.toggleTextActive]}>
              Harian
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'semua' && styles.toggleActive]}
            onPress={() => setViewMode('semua')}>
            <Text style={[styles.toggleText, viewMode === 'semua' && styles.toggleTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* HARIAN VIEW */}
        {viewMode === 'harian' && (
          hariGroups.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          ) : (
            hariGroups.map((group) => (
              <View key={group.date} style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>{group.label}</Text>
                  <Text style={styles.cardInfo}>Total transaksi: {group.totalTransaksi}x</Text>
                  <Text style={styles.cardInfo}>Total barang terjual: {group.totalBarang}x</Text>
                  <Text style={styles.cardInfo}>
                    Total pendapatan: Rp {group.totalPendapatan.toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.cardButtons}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => fetchDetail(group.transaksiIds, group.label)}>
                    <Text style={styles.detailBtnText}>Detail transaksi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.hapusBtn}
                    onPress={() => handleHapus(group.transaksiIds, group.label)}>
                    <Text style={styles.hapusBtnText}>Hapus transaksi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}

        {/* SEMUA VIEW */}
        {viewMode === 'semua' && (
          transaksiList.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          ) : (
            transaksiList.map((t, index) => (
              <View key={t.id_transaksi} style={styles.card}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>Transaksi ke-{transaksiList.length - index}</Text>
                  <Text style={styles.cardInfo}>{formatTanggal(t.created_at)}</Text>
                  <Text style={styles.cardInfo}>Total barang: {t.jumlah_barang}x</Text>
                  <Text style={styles.cardInfo}>
                    Total pendapatan: Rp {t.total_penjualan?.toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.cardButtons}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => fetchDetail([t.id_transaksi], `Transaksi #${t.id_transaksi}`)}>
                    <Text style={styles.detailBtnText}>Detail transaksi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.hapusBtn}
                    onPress={() => handleHapus([t.id_transaksi], `#${t.id_transaksi}`)}>
                    <Text style={styles.hapusBtnText}>Hapus transaksi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetail(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Detail Transaksi</Text>
            <Text style={styles.modalSubtitle}>{detailTitle}</Text>

            {detailLoading ? (
              <ActivityIndicator size="large" color="#6C40C7" />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Nama Barang</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Harga Satuan</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Harga Total</Text>
                </View>

                {detailData?.items.map((d) => (
                  <View key={d.id_detail_transaksi} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>
                      {d.barang?.nama_barang} x{d.jumlah_beli}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                      {d.barang?.harga?.toLocaleString('id-ID')}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {d.total_beli?.toLocaleString('id-ID')}
                    </Text>
                  </View>
                ))}

                <View style={styles.divider} />

                {/* Summary per transaksi */}
                {detailData?.transaksi.map((t) => (
                  <View key={t.id_transaksi} style={styles.summaryBlock}>
                    {viewMode === 'harian' && (
                      <Text style={styles.summaryDate}>{formatTanggal(t.created_at)}</Text>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Item</Text>
                      <Text style={styles.summaryValue}>{t.jumlah_barang}x</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Penjualan</Text>
                      <Text style={styles.summaryValue}>Rp {t.total_penjualan?.toLocaleString('id-ID')}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Bayar</Text>
                      <Text style={styles.summaryValue}>Rp {t.jumlah_bayar?.toLocaleString('id-ID')}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Kembalian</Text>
                      <Text style={[styles.summaryValue, { color: '#6C40C7' }]}>
                        Rp {t.kembalian?.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDetail(false)}>
              <Text style={styles.closeBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#E8D8FF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#D4B5F5',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 12 },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
  },
  toggleActive: { backgroundColor: '#6C40C7' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#666' },
  toggleTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 14 },
  loadingText: { marginTop: 12, color: '#999', fontSize: 14 },
  card: {
    backgroundColor: '#E8D8FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 6 },
  cardInfo: { fontSize: 12, color: '#555', marginBottom: 2 },
  cardButtons: { gap: 8 },
  detailBtn: {
    backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, alignItems: 'center',
  },
  detailBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  hapusBtn: {
    backgroundColor: '#FF5252', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, alignItems: 'center',
  },
  hapusBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    width: '100%', maxWidth: 500, maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16 },
  tableHeaderRow: {
    flexDirection: 'row', paddingBottom: 10,
    borderBottomWidth: 2, borderBottomColor: '#333', marginBottom: 8,
  },
  tableHeaderCell: { fontSize: 12, fontWeight: '700', color: '#333' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tableCell: { fontSize: 12, color: '#333' },
  divider: { height: 2, backgroundColor: '#333', marginVertical: 12 },
  summaryBlock: { marginBottom: 12, backgroundColor: '#F9F0FF', borderRadius: 8, padding: 12 },
  summaryDate: { fontSize: 11, color: '#999', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: '#555' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  closeBtn: {
    backgroundColor: '#6C40C7', paddingVertical: 12,
    borderRadius: 24, alignItems: 'center', marginTop: 16,
  },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});