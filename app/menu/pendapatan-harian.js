import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Platform
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

// IMPORT LIBRARY EXPO PRINT & SHARING
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const formatIDR = (value) => {
  if (!value) return 'Rp 0';
  return 'Rp ' + parseInt(value).toLocaleString('id-ID');
};

const formatDateIndo = (dateObj) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const dayName = days[dateObj.getDay()];
  const day = dateObj.getDate();
  const monthName = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${dayName}, ${day} ${monthName} ${year}`;
};

export default function PendapatanHarian() {
  const [isLoading, setIsLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0);
  const [revenueDiff, setRevenueDiff] = useState(0);
  const [revenuePercentage, setRevenuePercentage] = useState(0);
  const [isUp, setIsUp] = useState(true);
  
  const [todayItems, setTodayItems] = useState([]);
  const [totalTransactionsToday, setTotalTransactionsToday] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadDailyData();
    }, [])
  );

  const loadDailyData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      // Start of Today (00:00:00)
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      // Start of Yesterday (00:00:00)
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      // End of Yesterday (23:59:59)
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, -1);

      // 1. Ambil data transaksi dari kemarin sampai sekarang
      const { data: transaksiData } = await supabase
        .from('transaksi')
        .select('*')
        .gte('created_at', startOfYesterday.toISOString())
        .order('created_at', { ascending: false });

      // Pisahkan transaksi hari ini dan kemarin
      const todayTx = (transaksiData || []).filter(t => new Date(t.created_at) >= startOfToday);
      const yesterdayTx = (transaksiData || []).filter(t => {
        const txDate = new Date(t.created_at);
        return txDate >= startOfYesterday && txDate <= endOfYesterday;
      });

      // Hitung total omzet
      const sumToday = todayTx.reduce((sum, t) => sum + (t.total_penjualan || 0), 0);
      const sumYesterday = yesterdayTx.reduce((sum, t) => sum + (t.total_penjualan || 0), 0);

      setTodayRevenue(sumToday);
      setYesterdayRevenue(sumYesterday);
      setTotalTransactionsToday(todayTx.length);

      // Hitung perbandingan dengan kemarin
      const diff = sumToday - sumYesterday;
      setRevenueDiff(Math.abs(diff));
      setIsUp(diff >= 0);

      if (sumYesterday > 0) {
        const pct = (diff / sumYesterday) * 100;
        setRevenuePercentage(parseFloat(pct.toFixed(1)));
      } else {
        setRevenuePercentage(sumToday > 0 ? 100 : 0);
      }

      // 2. Ambil detail transaksi khusus hari ini untuk daftar barang terjual
      if (todayTx.length > 0) {
        const todayIds = todayTx.map(t => t.id_transaksi);
        
        const { data: detailData } = await supabase
          .from('detail_transaksi')
          .select('id_barang, jumlah_beli, total_beli, nama_barang_nota')
          .in('id_transaksi', todayIds);

        // Grouping barang yang sama agar jumlahnya terakumulasi
        const itemMap = {};
        (detailData || []).forEach(d => {
          const key = d.id_barang || `deleted_${d.nama_barang_nota}`;
          if (!itemMap[key]) {
            itemMap[key] = {
              nama_barang: d.nama_barang_nota || 'Produk Tidak Diketahui',
              total_terjual: 0,
              total_omzet: 0
            };
          }
          itemMap[key].total_terjual += d.jumlah_beli || 0;
          itemMap[key].total_omzet += d.total_beli || 0;
        });

        // Ubah map ke array dan urutkan dari yang paling laris hari ini
        const sortedItems = Object.values(itemMap).sort((a, b) => b.total_terjual - a.total_terjual);
        setTodayItems(sortedItems);
      } else {
        setTodayItems([]);
      }

    } catch (e) {
      console.error('Error loading data harian:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const formattedDate = formatDateIndo(new Date());

    // Mapping item terlaris hari ini ke tabel HTML
    const itemRows = todayItems.length === 0
      ? `<tr><td colspan="4" style="padding: 15px; text-align: center; color: #999;">Belum ada barang terjual hari ini.</td></tr>`
      : todayItems.map((item, index) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; text-align: center;"><b>${index + 1}</b></td>
          <td style="padding: 10px;">${item.nama_barang}</td>
          <td style="padding: 10px; text-align: center; font-weight: bold; color: #6C40C7;">${item.total_terjual} Pcs</td>
          <td style="padding: 10px; text-align: right; font-weight: bold;">${formatIDR(item.total_omzet)}</td>
        </tr>
      `).join('');

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; line-height: 1.4; }
            h1, h3 { text-align: center; margin: 0; }
            h1 { font-size: 22px; color: #111; }
            h3 { font-size: 14px; color: #666; margin-top: 5px; margin-bottom: 25px; }
            h4 { color: #6C40C7; font-size: 15px; border-bottom: 2px solid #6C40C7; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th { background-color: #F2F2F2; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>LAPORAN PENDAPATAN HARIAN TOKO</h1>
          <h3>Tanggal: ${formattedDate}</h3>
          
          <h4>1. RINGKASAN AKTIVITAS HARI INI</h4>
          <table>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold; font-size: 14px;">💰 Total Pendapatan Hari Ini</td>
              <td style="padding: 12px; color: #28a745; font-weight: bold; font-size: 15px; text-align: right;">${formatIDR(todayRevenue)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold;">🧾 Jumlah Transaksi Sukses</td>
              <td style="padding: 12px; text-align: right; font-weight: bold;">${totalTransactionsToday} Nota</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px; font-weight: bold;">📉 Pendapatan Kemarin</td>
              <td style="padding: 12px; text-align: right; color: #666;">${formatIDR(yesterdayRevenue)}</td>
            </tr>
          </table>

          <h4>2. DAFTAR BARANG TERJUAL HARI INI 🔥</h4>
          <table>
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">No</th>
                <th>Nama Barang</th>
                <th style="width: 20%; text-align: center;">Jumlah</th>
                <th style="width: 30%; text-align: right;">Total Omzet</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    try {
      // HANDLE TESTING DI WEB BROWSER
      if (Platform.OS === 'web') {
        const element = document.createElement('div');
        element.innerHTML = htmlContent;

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        
        script.onload = () => {
          const options = {
            margin:       0.5,
            filename:     `Laporan-Harian-${new Date().toISOString().split('T')[0]}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
          };
          window.html2pdf().set(options).from(element).save();
        };

        document.head.appendChild(script);
        return;
      }

      // PROSES UNTUK DI HP ASLI
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { dialogTitle: 'Simpan Laporan Harian PDF' });
    } catch (error) {
      console.error("Gagal mendownload PDF Harian:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Memuat data harian...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header Pendapatan Harian */}
      <View style={styles.headerCard}>
        <Text style={styles.headerLabel}>TOTAL PENDAPATAN HARI INI</Text>
        <Text style={styles.headerAmount}>{formatIDR(todayRevenue)}</Text>
        <Text style={styles.headerSub}>{formatDateIndo(new Date())}</Text>

        {/* Tombol Download PDF Harian */}
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
          <Text style={styles.downloadButtonText}>📥 Download Laporan Harian (PDF)</Text>
        </TouchableOpacity>

        {/* Perbandingan dengan Hari Kemarin */}
        <View style={styles.compareRow}>
          <Text style={styles.compareLabel}>vs Kemarin:</Text>
          <Text style={[
            styles.compareValue,
            isUp ? styles.compareUp : styles.compareDown,
          ]}>
            {isUp ? '▲' : '▼'} {formatIDR(revenueDiff)} ({isUp ? '+' : ''}{revenuePercentage}%)
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Transaksi Hari Ini:</Text>
          <Text style={styles.totalValue}>{totalTransactionsToday} Nota</Text>
        </View>
      </View>

      {/* Rincian Kemarin */}
      <View style={styles.yesterdayCard}>
        <Text style={styles.yesterdayLabel}>Pendapatan Kemarin</Text>
        <Text style={styles.yesterdayAmount}>{formatIDR(yesterdayRevenue)}</Text>
      </View>

      {/* Daftar Barang Terjual Hari Ini */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Barang Terjual Hari Ini</Text>
        {todayItems.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada barang terjual hari ini.</Text>
        ) : (
          todayItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.nama_barang}</Text>
                <Text style={styles.itemSub}>{formatIDR(item.total_omzet)}</Text>
              </View>
              <Text style={styles.itemQty}>{item.total_terjual} Pcs</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },

  // Header Card (Warna Biru / Sky Teal agar beda nuansa dengan Bulanan)
  headerCard: {
    backgroundColor: '#0284c7',
    padding: 24,
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4,
  },
  headerAmount: {
    fontSize: 32, fontWeight: '900',
    color: '#fff', marginBottom: 2,
  },
  headerSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.8)',
    marginBottom: 16, fontStyle: 'italic'
  },
  downloadButton: {
    backgroundColor: '#34D399',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  downloadButtonText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '800',
  },
  compareRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  compareLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  compareValue: { fontSize: 14, fontWeight: '700' },
  compareUp: { color: '#A7F3D0' },
  compareDown: { color: '#FCA5A5' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
  },
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  totalValue: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Yesterday Card
  yesterdayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  yesterdayLabel: { fontSize: 13, color: '#64748B' },
  yesterdayAmount: { fontSize: 16, fontWeight: '700', color: '#0284c7' },

  // Section List
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12,
  },
  emptyText: {
    fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingVertical: 16,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  numberBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center', alignItems: 'center',
  },
  numberText: { fontSize: 12, fontWeight: '700', color: '#0369A1' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  itemSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemQty: { fontSize: 14, fontWeight: '700', color: '#0284c7' },
});