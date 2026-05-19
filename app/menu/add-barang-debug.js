import React, { useState, useEffect } from 'react';
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
 * DEBUG VERSION - Simplified add-barang for troubleshooting
 * This version removes image complexity to isolate issues
 */
export default function AddBarangDebug() {
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = (message) => {
    console.log('[DEBUG]', message);
    setDebugLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const getPriceNumeric = (value) => {
    return value.replace(/\D/g, '');
  };

  const saveProduct = async () => {
    setIsLoading(true);
    addDebugLog('=== Starting saveProduct ===');

    try {
      const priceNumeric = parseInt(getPriceNumeric(productPrice)) || 0;
      const stockNumeric = parseInt(productStock) || 0;

      const insertData = {
        nama_barang: productName,
        harga: priceNumeric,
        stok: stockNumeric,
        gambar: null,
      };

      addDebugLog('Insert data: ' + JSON.stringify(insertData));

      const { data, error } = await supabase
        .from('barang')
        .insert([insertData])
        .select();

      if (error) {
        addDebugLog('ERROR: ' + error.message);
        addDebugLog('Full error: ' + JSON.stringify(error));
        Alert.alert('Error', 'Failed to add product: ' + error.message);
        setIsLoading(false);
        return;
      }

      addDebugLog('SUCCESS: Product added with ID ' + data[0]?.id_barang);
      Alert.alert('Success', 'Product added!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/menu/koleksi-barang');
          },
        },
      ]);
    } catch (error) {
      addDebugLog('EXCEPTION: ' + error.message);
      addDebugLog('Stack: ' + error.stack);
      Alert.alert('Error', 'Exception: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimpan = () => {
    addDebugLog('Validating form...');

    if (!productName) {
      addDebugLog('ERROR: Name is empty');
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!productPrice) {
      addDebugLog('ERROR: Price is empty');
      Alert.alert('Error', 'Price is required');
      return;
    }

    if (!productStock) {
      addDebugLog('ERROR: Stock is empty');
      Alert.alert('Error', 'Stock is required');
      return;
    }

    addDebugLog('Validation passed, calling saveProduct()');

    Alert.alert('Confirm', 'Add product: ' + productName + '?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Save',
        onPress: () => saveProduct(),
      },
    ]);
  };

  const clearLog = () => {
    setDebugLog([]);
    addDebugLog('Debug log cleared');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Debug Logs */}
        <View style={styles.debugSection}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>DEBUG LOG</Text>
            <TouchableOpacity onPress={clearLog} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logBox}>
            {debugLog.map((log, idx) => (
              <Text key={idx} style={styles.logText}>
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Add Product (No Images)</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              value={productName}
              onChangeText={(val) => {
                setProductName(val);
                addDebugLog('Name changed: ' + val);
              }}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price"
              value={productPrice}
              onChangeText={(val) => {
                setProductPrice(val);
                addDebugLog('Price changed: ' + val);
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Stock</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter stock"
              value={productStock}
              onChangeText={(val) => {
                setProductStock(val);
                addDebugLog('Stock changed: ' + val);
              }}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSimpan}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? 'Saving...' : 'Save Product'}
            </Text>
          </TouchableOpacity>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6C40C7" />
              <Text style={styles.loadingText}>Saving...</Text>
            </View>
          )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  debugSection: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logBox: {
    maxHeight: 150,
    padding: 10,
    backgroundColor: '#1e1e1e',
  },
  logText: {
    fontSize: 11,
    color: '#0f0',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#6C40C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
});
