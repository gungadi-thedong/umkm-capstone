import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Platform
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { runApriori, getTopItems, getUnsoldItems, getMonthlyComparison } from '@/lib/algo-apriori';

// 1. IMPORT LIBRARY EXPO PRINT & SHARING DI SINI
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const formatIDR = (value) => {
  if (!value) return 'Rp 0';
  return 'Rp ' + parseInt(value).toLocaleString('id-ID');
};

const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

export default function Pendapatan() {
  const [isLoading, setIsLoading] = useState(true);
  const [monthly, setMonthly] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [bottomItems, setBottomItems] = useState([]);
  const [unsoldItems, setUnsoldItems] = useState([]);
  const [aprioriResults, setAprioriResults] = useState([]);
  const [itemNameMap, setItemNameMap] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const { data: transaksiData } = await supabase
        .from('transaksi')
        .select('*')
        .order('created_at', { ascending: false });

      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: detailBulanIni } = await supabase
        .from('detail_transaksi')
        .select('*, barang(nama_barang, gambar)')
        .gte('id_transaksi', 0);

      const { data: allBarang } = await supabase
        .from('barang')
        .select('id_barang, nama_barang, stok');

      const { data: transaksiThisMonth } = await supabase
        .from('transaksi')
        .select('id_transaksi, created_at')
        .gte('created_at', firstDayThisMonth);

      const thisMonthIds = new Set((transaksiThisMonth || []).map(t => t.id_transaksi));
      const detailThisMonth = (detailBulanIni || []).filter(d => thisMonthIds.has(d.id_transaksi));

      const nameMap = {};
      (allBarang || []).forEach(b => {
        nameMap[b.id_barang] = b.nama_barang;
      });
      setItemNameMap(nameMap);

      const monthlyData = getMonthlyComparison(transaksiData || []);
      setMonthly(monthlyData);

      const total = (transaksiData || []).reduce((s, t) => s + (t.total_penjualan || 0), 0);
      setTotalRevenue(total);

      const top = getTopItems(detailThisMonth, 10);
      setTopItems(top);

      const allSoldThisMonth = getTopItems(detailThisMonth, 999);
      setBottomItems(allSoldThisMonth.slice(-10).reverse());

      const soldIds = detailThisMonth.map(d => d.id_barang);
      const unsold = getUnsoldItems(allBarang || [], soldIds);
      setUnsoldItems(unsold);

      const transactionGroups = {};
      detailThisMonth.forEach(d => {
        if (!transactionGroups[d.id_transaksi]) {
          transactionGroups[d.id_transaksi] = [];
        }
        transactionGroups[d.id_transaksi].push(d.id_barang);
      });

      const transactions = Object.values(transactionGroups);
      const apriori = runApriori(transactions, 2, 3);
      setAprioriResults(apriori.slice(0, 15));

    } catch (e) {
      console.error('Error loading pendapatan:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. FUNGSI SAKTI UNTUK GENERATE DAN DOWNLOAD PDF DI HP
  const handleDownloadPDF = async () => {
    const currentMonthName = MONTHS_ID[new Date().getMonth()];
    const currentYear = new Date().getFullYear();

    // Mapping Data Looping Supabase ke dalam bentuk baris Tabel HTML
    const topItemsRows = topItems.map((item, index) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px; text-align: center;"><b>${index + 1}</b></td>
        <td style="padding: 10px;">${item.nama_barang}</td>
        <td style="padding: 10px; font-weight: bold; color: #6C40C7;">${item.total_terjual} Pcs</td>
      </tr>
    `).join('');

    const bottomItemsRows = bottomItems.map((item, index) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px; text-align: center;"><b>${index + 1}</b></td>
        <td style="padding: 10px;">${item.nama_barang}</td>
        <td style="padding: 10px; font-weight: bold; color: #FF9800;">${item.total_terjual} Pcs</td>
      </tr>
    `).join('');

    const aprioriRows = aprioriResults.length === 0 
      ? `<tr><td colspan="3" style="padding: 15px; text-align: center; color: #999;">Belum cukup data transaksi untuk pola bersamaan.</td></tr>`
      : aprioriResults.map((result, index) => {
          const comboNames = result.items.map(id => itemNameMap[id] || `Item #${id}`).join(' <b>+</b> ');
          return `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; text-align: center;"><b>${index + 1}</b></td>
              <td style="padding: 10px;">${comboNames}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #6C40C7;">${result.support} Kali</td>
            </tr>
          `;
        }).join('');

    // Kode Struktur HTML Laporan Remade (Ramah Orang Tua Usia 40+)
    const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; line-height: 1.4; }
              h1, h3 { text-align: center; margin: 0; }
              h1 { font-size: 24px; color: #111; }
              h3 { font-size: 16px; color: #666; margin-top: 5px; margin-bottom: 25px; }
              h4 { color: #6C40C7; font-size: 16px; border-bottom: 2px solid #6C40C7; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
              th { background-color: #F2F2F2; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
              .tip { font-size: 12px; color: #666; font-style: italic; margin-top: -5px; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h1>LAPORAN BULANAN PENJUALAN TOKO</h1>
            <h3>Periode Laporan: ${currentMonthName} ${currentYear}</h3>
            
            <h4>1. RINGKASAN UTAMA TOKO</h4>
            <table>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; font-weight: bold; font-size: 15px;">💰 Total Pendapatan (Omzet)</td>
                <td style="padding: 12px; color: #28a745; font-weight: bold; font-size: 16px;">${formatIDR(monthly?.thisMonthRevenue)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; font-weight: bold;">📈 Produk Paling Laris</td>
                <td style="padding: 12px;">${topItems[0]?.nama_barang || '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; font-weight: bold;">📉 Produk Kurang Laku</td>
                <td style="padding: 12px;">${bottomItems[0]?.nama_barang || '-'}</td>
              </tr>
            </table>

            <h4>2. 10 BARANG PALING LAKU (TERLARIS) 🔥</h4>
            <table>
              <thead><tr><th style="width: 10%; text-align: center;">No</th><th>Nama Barang</th><th style="width: 30%;">Terjual</th></tr></thead>
              <tbody>${topItemsRows}</tbody>
            </table>

            <h4>3. 10 BARANG KURANG LAKU 📉</h4>
            <table>
              <thead><tr><th style="width: 10%; text-align: center;">No</th><th>Nama Barang</th><th style="width: 30%;">Terjual</th></tr></thead>
              <tbody>${bottomItemsRows}</tbody>
            </table>

            <h4>4. REKOMENDASI ATUR RAK TOKO (Hasil Analisis Apriori)</h4>
            <p class="tip">*Petunjuk Praktis: Posisikan barang-barang di bawah ini secara berdekatan di rak toko Anda.</p>
            <table>
              <thead><tr><th style="width: 10%; text-align: center;">No</th><th>Kombinasi Produk 🤝</th><th style="width: 30%; text-align: center;">Sering di Nota</th></tr></thead>
              <tbody>${aprioriRows}</tbody>
            </table>
          </body>
        </html>
      `;
    try {
      // 🌟 TRIK KHUSUS TESTING DI PC (BROWSER) 🌟
      if (Platform.OS === 'web') {
      //   // Opsi A: Langsung buka di Tab Baru (Paling direkomendasikan buat testing cepet)
      //   const newWindow = window.open();
      //   if (newWindow) {
      //     newWindow.document.write(htmlContent);
      //     newWindow.document.close();
      //   }
      //   return; // Stop di sini, jangan jalankan fungsi HP

        // 🌟 TRIK KHUSUS TESTING DI PC (BROWSER) - SEKARANG DOWNLOAD .PDF ASLI 🌟
        // 1. Buat elemen bungkus HTML sementara di browser
        const element = document.createElement('div');
        element.innerHTML = htmlContent;

        // 2. Load script html2pdf secara dinamis dari internet
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        
        script.onload = () => {
          // 3. Konfigurasi download PDF-nya
          const options = {
            margin:       0.5,
            filename:     `Laporan-Penjualan-${currentMonthName}-${currentYear}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 }, // Biar teks tajam pas di-zoom
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
          };

          // 4. Eksekusi download PDF langsung di PC tanpa pop-up print!
          window.html2pdf().set(options).from(element).save();
        };

        document.head.appendChild(script);
        return; // Stop, jangan jalankan fungsi internal HP
      }

      // 📱 PROSES UNTUK DI HP ASLI (Gak bakal terganggu)
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { dialogTitle: 'Simpan Laporan PDF' });
    } catch (error) {
      console.error("Gagal mendownload PDF:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C40C7" />
        <Text style={styles.loadingText}>Menghitung data...</Text>
      </View>
    );
  }

  const now = new Date();
  const thisMonthName = MONTHS_ID[now.getMonth()];
  const lastMonthName = MONTHS_ID[now.getMonth() === 0 ? 11 : now.getMonth() - 1];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header Pendapatan */}
      <View style={styles.headerCard}>
        <Text style={styles.headerLabel}>TOTAL PENDAPATAN BULAN INI</Text>
        <Text style={styles.headerAmount}>{formatIDR(monthly?.thisMonthRevenue)}</Text>

        {/* 3. INI TOMBOL DOWNLOAD BARU UNTUK VERSI MOBILE */}
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
          <Text style={styles.downloadButtonText}>📥 Download Laporan (PDF)</Text>
        </TouchableOpacity>

        {/* Perbandingan bulan lalu */}
        {monthly?.lastMonthRevenue > 0 && (
          <View style={styles.compareRow}>
            <Text style={styles.compareLabel}>vs {lastMonthName}:</Text>
            <Text style={[
              styles.compareValue,
              monthly.isUp ? styles.compareUp : styles.compareDown,
            ]}>
              {monthly.isUp ? '▲' : '▼'} {formatIDR(Math.abs(monthly.diff))}
              {monthly.pct !== null && ` (${monthly.pct > 0 ? '+' : ''}${monthly.pct}%)`}
            </Text>
          </View>
        )}

        {monthly?.lastMonthRevenue === 0 && (
          <Text style={styles.noLastMonth}>Belum ada data bulan lalu</Text>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total semua waktu:</Text>
          <Text style={styles.totalValue}>{formatIDR(totalRevenue)}</Text>
        </View>
      </View>

      {/* Bulan lalu */}
      {monthly?.lastMonthRevenue > 0 && (
        <View style={styles.lastMonthCard}>
          <Text style={styles.lastMonthLabel}>Pendapatan {lastMonthName}</Text>
          <Text style={styles.lastMonthAmount}>{formatIDR(monthly.lastMonthRevenue)}</Text>
        </View>
      )}

      {/* Top 10 Terlaris */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 10 Barang Terlaris Bulan Ini</Text>
        {topItems.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada transaksi bulan ini</Text>
        ) : (
          topItems.map((item, index) => (
            <View key={item.id_barang} style={styles.rankRow}>
              <View style={[
                styles.rankBadge,
                index === 0 && styles.rank1,
                index === 1 && styles.rank2,
                index === 2 && styles.rank3,
              ]}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.rankName} numberOfLines={1}>{item.nama_barang}</Text>
              <Text style={styles.rankQty}>{item.total_terjual}x terjual</Text>
            </View>
          ))
        )}
      </View>

      {/* Bottom 10 Kurang Laku */}
      {bottomItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📉 Barang Kurang Laku Bulan Ini</Text>
          {bottomItems.map((item, index) => (
            <View key={item.id_barang} style={styles.rankRow}>
              <View style={styles.rankBadgeGray}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.rankName} numberOfLines={1}>{item.nama_barang}</Text>
              <Text style={styles.rankQtyLow}>{item.total_terjual}x terjual</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tidak Terjual */}
      {unsoldItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Tidak Terjual Bulan Ini</Text>
          {unsoldItems.map((item) => (
            <View key={item.id_barang} style={styles.unsoldRow}>
              <Text style={styles.unsoldName} numberOfLines={1}>{item.nama_barang}</Text>
              <Text style={styles.unsoldStok}>Stok: {item.stok}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Apriori Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔗 Barang Sering Dibeli Bersamaan</Text>
        <Text style={styles.aprioriDesc}>
          Berdasarkan pola transaksi bulan ini
        </Text>

        {aprioriResults.length === 0 ? (
          <View style={styles.aprioriEmpty}>
            <Text style={styles.emptyText}>
              Belum cukup data untuk menemukan pola.{'\n'}
              Diperlukan minimal 2 transaksi dengan item yang sama.
            </Text>
          </View>
        ) : (
          aprioriResults.map((result, index) => (
            <View key={index} style={styles.aprioriCard}>
              <View style={styles.aprioriItems}>
                {result.items.map((id, i) => (
                  <React.Fragment key={id}>
                    <View style={styles.aprioriItemChip}>
                      <Text style={styles.aprioriItemText} numberOfLines={1}>
                        {itemNameMap[id] || `Item #${id}`}
                      </Text>
                    </View>
                    {i < result.items.length - 1 && (
                      <Text style={styles.aprioriPlus}>+</Text>
                    )}
                  </React.Fragment>
                ))}
              </View>
              <View style={styles.aprioriSupportBadge}>
                <Text style={styles.aprioriSupportText}>{result.support}x</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },

  // STYLE BARU UNTUK BUTTON DOWNLOAD PDF
  downloadButton: {
    backgroundColor: '#69F0AE',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '800',
  },

  // Header Card
  headerCard: {
    backgroundColor: '#6C40C7',
    padding: 24,
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 8,
  },
  headerAmount: {
    fontSize: 32, fontWeight: '900',
    color: '#fff', marginBottom: 12,
  },
  compareRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  compareLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  compareValue: { fontSize: 14, fontWeight: '700' },
  compareUp: { color: '#69F0AE' },
  compareDown: { color: '#FF5252' },
  noLastMonth: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
  },
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  totalValue: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Last month card
  lastMonthCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8D8FF',
  },
  lastMonthLabel: { fontSize: 13, color: '#666' },
  lastMonthAmount: { fontSize: 16, fontWeight: '700', color: '#6C40C7' },

  // Sections
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E8D8FF',
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12,
  },
  emptyText: {
    fontSize: 13, color: '#999', textAlign: 'center',
    paddingVertical: 8, lineHeight: 20,
  },

  // Rank rows
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E8D8FF',
    justifyContent: 'center', alignItems: 'center',
  },
  rank1: { backgroundColor: '#FFD700' },
  rank2: { backgroundColor: '#C0C0C0' },
  rank3: { backgroundColor: '#CD7F32' },
  rankBadgeGray: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center',
  },
  rankText: { fontSize: 12, fontWeight: '700', color: '#333' },
  rankName: { flex: 1, fontSize: 13, color: '#333', fontWeight: '500' },
  rankQty: { fontSize: 12, fontWeight: '700', color: '#6C40C7' },
  rankQtyLow: { fontSize: 12, fontWeight: '700', color: '#FF9800' },

  // Unsold
  unsoldRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  unsoldName: { flex: 1, fontSize: 13, color: '#666' },
  unsoldStok: { fontSize: 12, color: '#999' },

  // Apriori
  aprioriDesc: {
    fontSize: 12, color: '#999', marginBottom: 12, marginTop: -8,
  },
  aprioriEmpty: {
    paddingVertical: 16, alignItems: 'center',
  },
  aprioriCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F0FF',
    borderRadius: 10, padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#E8D8FF',
    gap: 8,
  },
  aprioriItems: {
    flex: 1, flexDirection: 'row',
    flexWrap: 'wrap', alignItems: 'center', gap: 4,
  },
  aprioriItemChip: {
    backgroundColor: '#6C40C7',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    maxWidth: 120,
  },
  aprioriItemText: {
    fontSize: 11, fontWeight: '600', color: '#fff',
  },
  aprioriPlus: {
    fontSize: 14, fontWeight: '700', color: '#6C40C7',
  },
  aprioriSupportBadge: {
    backgroundColor: '#E8D8FF',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    minWidth: 44, alignItems: 'center',
  },
  aprioriSupportText: {
    fontSize: 13, fontWeight: '800', color: '#6C40C7',
  },
});