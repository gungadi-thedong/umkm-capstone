import { StyleSheet, View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    // Handle login logic here
    if (email && password) {
      alert('Login berhasil!');
      router.push('../menu/koleksi-barang');
      // Redirect to dashboard or main screen
    } else {
      alert('Silakan isi email dan password');
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
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="masukan username anda"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="default"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="masukan password anda"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginLeft: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  welcomeSection: {
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    lineHeight: 32,
  },
  formContainer: {
    backgroundColor: '#E8D8FF',
    borderRadius: 16,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFF',
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    color: '#000',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textDecorationLine: 'underline',
  },
});
