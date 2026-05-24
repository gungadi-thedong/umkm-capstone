// ============================================================
// APRIORI ALGORITHM - Pure Logic (no UI)
// ============================================================

/**
 * Generate all subsets of size `size` from array
 */
function getCombinations(arr, size) {
  const result = [];
  function combine(start, combo) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combine(i + 1, [...combo, arr[i]]);
    }
  }
  combine(0, []);
  return result;
}

/**
 * Main Apriori function
 * @param {Array} transactions - Array of arrays: [[id_barang1, id_barang2], ...]
 * @param {number} minSupport - Minimum times itemset must appear (default 5)
 * @param {number} maxSize - Max itemset size to check (default 3)
 * @returns {Array} frequent itemsets sorted by support desc
 */
export function runApriori(transactions, minSupport = 5, maxSize = 3) {
  const results = [];

  // Filter transaksi yang punya lebih dari 1 item (biar bisa ada association)
  const validTransactions = transactions.filter(t => t.length > 1);

  if (validTransactions.length === 0) return [];

  // Get all unique items
  const allItems = [...new Set(validTransactions.flat())];

  // Check itemsets of size 2, 3, ...
  for (let size = 2; size <= maxSize; size++) {
    const candidates = getCombinations(allItems, size);

    for (const candidate of candidates) {
      const candidateSet = new Set(candidate);

      // Count how many transactions contain ALL items in candidate
      const support = validTransactions.filter(transaction => {
        const transSet = new Set(transaction);
        return [...candidateSet].every(item => transSet.has(item));
      }).length;

      if (support >= minSupport) {
        results.push({
          items: candidate,
          support,
        });
      }
    }
  }

  // Sort by support descending
  return results.sort((a, b) => b.support - a.support);
}

/**
 * Get top N most sold items from detail_transaksi data
 * @param {Array} detailData - Array of {id_barang, nama_barang, jumlah_beli}
 * @param {number} topN
 */
export function getTopItems(detailData, topN = 10) {
  const itemMap = {};

  for (const d of detailData) {
    const key = d.id_barang;
    if (!itemMap[key]) {
      itemMap[key] = {
        id_barang: d.id_barang,
        nama_barang: d.barang?.nama_barang || d.nama_barang || 'Unknown',
        total_terjual: 0,
      };
    }
    itemMap[key].total_terjual += d.jumlah_beli || 0;
  }

  return Object.values(itemMap)
    .sort((a, b) => b.total_terjual - a.total_terjual)
    .slice(0, topN);
}

/**
 * Get items NOT sold this month
 * @param {Array} allBarang - All products from barang table
 * @param {Array} soldIds - Array of id_barang that were sold this month
 */
export function getUnsoldItems(allBarang, soldIds) {
  const soldSet = new Set(soldIds);
  return allBarang.filter(b => !soldSet.has(b.id_barang));
}

/**
 * Calculate monthly revenue comparison
 * @param {Array} transaksiData - All transaksi with created_at
 * @returns {{ thisMonth, lastMonth, diff, isUp }}
 */
export function getMonthlyComparison(transaksiData) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastYear = lastMonthDate.getFullYear();

  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;

  for (const t of transaksiData) {
    const date = new Date(new Date(t.created_at).getTime() + 7 * 60 * 60 * 1000);
    const m = date.getUTCMonth();
    const y = date.getUTCFullYear();

    if (m === thisMonth && y === thisYear) {
      thisMonthRevenue += t.total_penjualan || 0;
    } else if (m === lastMonth && y === lastYear) {
      lastMonthRevenue += t.total_penjualan || 0;
    }
  }

  const diff = thisMonthRevenue - lastMonthRevenue;
  const pct = lastMonthRevenue > 0
    ? Math.round((diff / lastMonthRevenue) * 100)
    : null;

  return {
    thisMonthRevenue,
    lastMonthRevenue,
    diff,
    isUp: diff >= 0,
    pct,
  };
}