import { StyleSheet, View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function HomeScreen() {
  const [usernameInput, setUsernameInput] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); 
  const [showPassword, setShowPassword] = useState(false); // TAMBAHAN: State kontrol mata password
  const router = useRouter();

  const handleLogin = async () => {
    if (!usernameInput || !password) {
      alert('Silakan isi username dan password');
      return;
    }

    setLoading(true);

    try {
      const { data: dataUser, error } = await supabase
        .from('user')
        .select('id, nama, password')
        .eq('nama', usernameInput.trim())
        .single();

      if (error || !dataUser) {
        alert('Username tidak ditemukan!');
        setLoading(false);
        return;
      }

      if (dataUser.password === password) {
        await AsyncStorage.setItem('user_id', dataUser.id.toString());
        alert(`Login berhasil! Selamat datang ${dataUser.nama}`);
        
        // FIX PENTING: Pakai router.replace saat masuk biar halaman login terhapus dari history navigation stack
        router.replace('/menu/koleksi-barang');
      } else {
        alert('Password salah, silakan coba lagi.');
      }
    } catch (err) {
      console.log('Error pas proses login:', err);
      alert('Terjadi kesalahan koneksi ke database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Selamat Datang,</Text>
          <Text style={styles.welcomeSubtitle}>silahkan login terlebih dahulu.</Text>
        </View>

        {/* Login Form Container */}
        <View style={styles.formContainer}>
          {/* Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="masukan username anda"
              placeholderTextColor="#999"
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
              keyboardType="default"
            />
          </View>

          {/* Password Input dengan Fitur Intip Mata */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="masukan password anda"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry={!showPassword} // Dinamis mengikuti state showPassword
              />
              <TouchableOpacity 
                style={styles.eyeButton} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'flex-start', paddingTop: 80 },
  welcomeSection: { marginBottom: 40 },
  welcomeTitle: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 28, fontWeight: '700', color: '#000', lineHeight: 32 },
  formContainer: { backgroundColor: '#E8D8FF', borderRadius: 16, padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 },
  input: { backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#FFF' },
  
  // FIX STYLING BARU INPUT PASSWORD + MATA
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFF',
  },
  eyeButton: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 18,
  },

  loginButton: { backgroundColor: '#000', borderRadius: 20, paddingVertical: 12, alignItems: 'center', marginTop: 24, marginBottom: 16, height: 48, justifyContent: 'center' },
  loginButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});