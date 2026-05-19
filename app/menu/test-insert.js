import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function TestInsert() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const addLog = (type, message) => {
    setTestResults((prev) => [
      ...prev,
      {
        id: Date.now(),
        type,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    addLog('info', 'Testing Supabase connection...');

    try {
      // Test 1: Check if we can query categories
      addLog('info', 'Test 1: Fetching categories...');
      const { data: categories, error: catError } = await supabase
        .from('kategori_barang')
        .select('*')
        .limit(1);

      if (catError) {
        addLog('error', 'Categories error: ' + catError.message);
      } else {
        addLog('success', 'Categories found: ' + (categories?.length || 0));
      }

      // Test 2: Check if barang table exists
      addLog('info', 'Test 2: Checking barang table...');
      const { data: barang, error: barangError } = await supabase
        .from('barang')
        .select('*')
        .limit(1);

      if (barangError) {
        addLog('error', 'Barang error: ' + barangError.message);
      } else {
        addLog('success', 'Barang table accessible, found ' + (barang?.length || 0) + ' products');
      }

      // Test 3: Try a test insert
      addLog('info', 'Test 3: Attempting test insert...');
      const testProduct = {
        nama_barang: 'Test Product ' + Date.now(),
        harga: 10000,
        stok: 5,
        gambar: null,
      };

      const { data: insertData, error: insertError } = await supabase
        .from('barang')
        .insert([testProduct])
        .select();

      if (insertError) {
        addLog('error', 'Insert error: ' + insertError.message);
        addLog('error', 'Details: ' + JSON.stringify(insertError));
      } else {
        addLog('success', 'Insert successful! ID: ' + (insertData?.[0]?.id_barang || 'unknown'));
      }
    } catch (error) {
      addLog('error', 'Catch error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testWithCategory = async () => {
    setIsLoading(true);
    setTestResults([]);
    addLog('info', 'Testing insert with category...');

    try {
      // First get a category
      addLog('info', 'Fetching first category...');
      const { data: categories, error: catError } = await supabase
        .from('kategori_barang')
        .select('id_kategori')
        .limit(1);

      if (catError || !categories || categories.length === 0) {
        addLog('error', 'No categories found');
        setIsLoading(false);
        return;
      }

      const categoryId = categories[0].id_kategori;
      addLog('success', 'Using category ID: ' + categoryId);

      // Now insert with category
      addLog('info', 'Inserting product with category...');
      const testProduct = {
        nama_barang: 'Mie Test ' + Date.now(),
        harga: 5000,
        stok: 20,
        gambar: null,
        id_kategori: categoryId,
      };

      addLog('info', 'Product data: ' + JSON.stringify(testProduct));

      const { data: insertData, error: insertError } = await supabase
        .from('barang')
        .insert([testProduct])
        .select();

      if (insertError) {
        addLog('error', 'Insert error: ' + insertError.message);
        addLog('error', 'Code: ' + insertError.code);
      } else {
        addLog('success', 'Insert successful! ID: ' + (insertData?.[0]?.id_barang || 'unknown'));
      }
    } catch (error) {
      addLog('error', 'Catch error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/menu/koleksi-barang')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Database</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testConnection}
          disabled={isLoading}>
          <Text style={styles.buttonText}>Test Basic Insert</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.categoryButton]}
          onPress={testWithCategory}
          disabled={isLoading}>
          <Text style={styles.buttonText}>Test With Category</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
          disabled={isLoading}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9370DB" />
          <Text style={styles.loadingText}>Testing...</Text>
        </View>
      )}

      {/* Test Results */}
      <ScrollView style={styles.resultsContainer}>
        {testResults.length === 0 ? (
          <Text style={styles.emptyText}>Click a button to start testing</Text>
        ) : (
          testResults.map((result) => (
            <View key={result.id} style={styles.resultItem}>
              <View
                style={[
                  styles.resultIndicator,
                  result.type === 'error'
                    ? styles.errorIndicator
                    : result.type === 'success'
                    ? styles.successIndicator
                    : styles.infoIndicator,
                ]}
              />
              <View style={styles.resultContent}>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '30%',
  },
  testButton: {
    backgroundColor: '#9370DB',
  },
  categoryButton: {
    backgroundColor: '#FFA500',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#999',
  },
  resultItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 6,
  },
  errorIndicator: {
    backgroundColor: '#FF6B6B',
  },
  successIndicator: {
    backgroundColor: '#4CAF50',
  },
  infoIndicator: {
    backgroundColor: '#2196F3',
  },
  resultContent: {
    flex: 1,
  },
  resultTime: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  resultMessage: {
    fontSize: 12,
    color: '#000',
    lineHeight: 18,
  },
});
