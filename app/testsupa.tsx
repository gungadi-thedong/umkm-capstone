import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

export default function TestSupa() {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.from('user').select('*');
      if (error) setStatus('❌ GAGAL: ' + error.message);
      else setStatus('✅ KONEK! Data: ' + JSON.stringify(data));
    }
    test();
  }, []);

  return (
   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
  <Text style={{ color: 'black', textAlign: 'center', padding: 20 }}>{status}</Text>
</View>
  );
}