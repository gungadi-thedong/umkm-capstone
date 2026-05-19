import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

/**
 * Direct Insert Test - Bypasses all form logic
 * Tests pure database insertion to verify table structure
 */
export default function DirectInsertTest() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    console.log('[DirectTest]', message);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testInsertDirect = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog('=== STARTING DIRECT INSERT TEST ===');

    try {
      addLog('1. Creating test data object...');
      const testData = {
        nama_barang: 'Direct Test ' + Date.now(),
        harga: 50000,
        stok: 10,
        gambar: null,
      };
      addLog('Test data: ' + JSON.stringify(testData));

      addLog('2. Attempting insert into "barang" table...');
      const { data, error } = await supabase
        .from('barang')
        .insert([testData])
        .select();

      if (error) {
        addLog('❌ ERROR: ' + error.message);
        addLog('Error code: ' + error.code);
        addLog('Error details: ' + JSON.stringify(error));
        Alert.alert('Insert Failed', error.message);
        setIsLoading(false);
        return;
      }

      addLog('✅ SUCCESS! Data inserted');
      addLog('Inserted ID: ' + data[0]?.id_barang);
      addLog('Full response: ' + JSON.stringify(data[0]));
      Alert.alert('Success', 'Product inserted! ID: ' + data[0]?.id_barang);
    } catch (err) {
      addLog('❌ EXCEPTION: ' + err.message);
      addLog('Stack: ' + err.stack);
      Alert.alert('Exception', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testInsertWithCategory = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog('=== TESTING INSERT WITH CATEGORY ===');

    try {
      addLog('1. Fetching categories...');
      const { data: categories, error: catError } = await supabase
        .from('kategori_barang')
        .select('id_kategori, nama_kategori')
        .limit(1);

      if (catError) {
        addLog('❌ ERROR fetching categories: ' + catError.message);
        setIsLoading(false);
        return;
      }

      if (!categories || categories.length === 0) {
        addLog('❌ No categories found!');
        setIsLoading(false);
        return;
      }

      const categoryId = categories[0].id_kategori;
      addLog('✅ Found category: ' + categories[0].nama_kategori + ' (ID: ' + categoryId + ')');

      addLog('2. Creating test data with category...');
      const testData = {
        nama_barang: 'Test with Category ' + Date.now(),
        harga: 75000,
        stok: 15,
        gambar: null,
        id_kategori: categoryId,
      };
      addLog('Test data: ' + JSON.stringify(testData));

      addLog('3. Attempting insert...');
      const { data, error } = await supabase
        .from('barang')
        .insert([testData])
        .select();

      if (error) {
        addLog('❌ ERROR: ' + error.message);
        addLog('Error code: ' + error.code);
        addLog('Error details: ' + JSON.stringify(error));
        Alert.alert('Insert Failed', error.message);
        setIsLoading(false);
        return;
      }

      addLog('✅ SUCCESS! Data inserted with category');
      addLog('Inserted ID: ' + data[0]?.id_barang);
      Alert.alert('Success', 'Product with category inserted! ID: ' + data[0]?.id_barang);
    } catch (err) {
      addLog('❌ EXCEPTION: ' + err.message);
      Alert.alert('Exception', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/menu/koleksi-barang')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Direct Insert Test</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.testButton, isLoading && styles.disabled]}
            onPress={testInsertDirect}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? 'Testing...' : 'Test 1: Basic Insert'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton, isLoading && styles.disabled]}
            onPress={testInsertWithCategory}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? 'Testing...' : 'Test 2: With Category'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearLogs}>
            <Text style={styles.buttonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        <View style={styles.logContainer}>
          <Text style={styles.logTitle}>📋 Test Logs:</Text>
          <View style={styles.logBox}>
            {logs.length === 0 ? (
              <Text style={styles.logText}>No logs yet. Click a test button.</Text>
            ) : (
              logs.map((log, idx) => (
                <Text key={idx} style={styles.logText}>
                  {log}
                </Text>
              ))
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ What This Tests:</Text>
          <Text style={styles.infoText}>
            • Test 1: Inserts a product WITHOUT category{'\n'}
            • Test 2: Fetches category, then inserts WITH category{'\n'}
            • Both tests target the "barang" table directly{'\n'}
            • No form logic, just pure database operations
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  buttonGroup: {
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#6C40C7',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  },
  logContainer: {
    marginBottom: 20,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  logBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  logText: {
    fontSize: 12,
    color: '#0f0',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  infoBox: {
    backgroundColor: '#E8D8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
});
