import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SimpleButton } from '../components/SimpleControls';
import { listExerciseNames } from '../learning/exerciseStore';

export interface HomeScreenProps {
  /** Bumps when returning from calibration so the list refreshes. */
  refreshKey: number;
  onCreate: (name: string) => void;
  onSelect: (name: string) => void;
}

/**
 * Entry screen: enter a custom exercise name or select a calibrated one.
 */
export function HomeScreen({
  refreshKey,
  onCreate,
  onSelect,
}: HomeScreenProps): React.JSX.Element {
  const [name, setName] = useState('');
  const exercises = useMemo(() => listExerciseNames(), [refreshKey]);

  /**
   * Starts calibration for the typed exercise name.
   */
  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onCreate(trimmed);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Exercise Rep Counter</Text>
      <Text style={styles.hint}>
        Enter a name, calibrate 3–5 reps with the camera, then count.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Exercise name (e.g. Bicep Curls)"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <SimpleButton label="Create & Calibrate" onPress={handleCreate} />

      <Text style={styles.section}>Calibrated exercises</Text>
      {exercises.length === 0 ? (
        <Text style={styles.empty}>None yet — create one above.</Text>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <SimpleButton
              label={`Count: ${item}`}
              onPress={() => onSelect(item)}
              style={styles.listButton}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  section: {
    marginTop: 28,
    marginBottom: 8,
    fontSize: 16,
  },
  empty: {
    color: '#666',
  },
  listButton: {
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
  },
});
