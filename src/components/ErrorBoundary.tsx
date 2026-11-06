import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SimpleButton } from './SimpleControls';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render/startup errors so a release APK shows a recoverable screen
 * instead of exiting immediately.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  /**
   * Stores the thrown error in component state for display.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  /**
   * Logs the error for device log inspection.
   */
  componentDidCatch(error: Error): void {
    console.error('[ErrorBoundary]', error);
  }

  /**
   * Clears the error and optionally notifies the parent to remount children.
   */
  handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <SimpleButton label="Try again" onPress={this.handleReset} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 12,
  },
  title: {
    fontSize: 20,
  },
  message: {
    fontSize: 14,
    color: '#444',
  },
});
