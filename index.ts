import { registerRootComponent } from 'expo';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Standalone boot probe (no Metro/dev-client required).
 * Confirms the native binary can mount a React surface.
 */
function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercise Counter</Text>
      <Text style={styles.subtitle}>Boot OK (v1.0.4)</Text>
      <Text style={styles.hint}>
        Standalone APK loaded successfully. Camera UI will be restored next.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111111',
  },
  subtitle: {
    fontSize: 18,
    color: '#111111',
  },
  hint: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
  },
});

registerRootComponent(App);
