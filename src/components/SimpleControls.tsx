import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

export interface SimpleButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Minimal pressable control used across the prototype screens.
 */
export function SimpleButton({
  label,
  onPress,
  disabled = false,
  style,
}: SimpleButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export interface SimpleControlsProps {
  children: React.ReactNode;
}

/**
 * Bottom control strip that keeps buttons above the camera preview chrome.
 */
export function SimpleControls({
  children,
}: SimpleControlsProps): React.JSX.Element {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: '#111',
  },
  button: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
});
