import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level error boundary for the watch app.
 * Catches unhandled JS errors and shows a compact fallback screen
 * instead of a white screen / crash.
 *
 * Uses hardcoded watchColors so it renders correctly even if
 * providers above it crash.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRestart = async () => {
    if (__DEV__) {
      this.setState({ hasError: false });
      return;
    }
    try {
      await Updates.reloadAsync();
    } catch {
      this.setState({ hasError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🏓</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>Tap below to restart</Text>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={this.handleRestart}
          >
            <Text style={styles.buttonText}>Restart</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e6edf5',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#8b99ab',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
