import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * Temporary boot probe. If this screen appears, the development client + Metro
 * pipeline is healthy and we can re-enable the full exercise UI.
 */
export default function App(): React.JSX.Element {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercise Counter</Text>
      <Text style={styles.subtitle}>Boot OK — Metro is connected.</Text>
      <Text style={styles.hint}>
        If you see this, tell me and I will restore the full camera UI.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    color: '#111',
  },
  hint: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
});
