import { registerRootComponent } from 'expo';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Standalone boot probe with no camera/MediaPipe native modules linked.
 */
function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercise Counter</Text>
      <Text style={styles.subtitle}>Boot OK (v1.0.5)</Text>
      <Text style={styles.hint}>
        Native modules stripped for startup test. If you see this, the crash was
        from MediaPipe/Vision Camera native init.
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
