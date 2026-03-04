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
 * Top-level error boundary for the mobile app.
 * Catches unhandled JS errors and shows a branded fallback screen
 * instead of a white screen / crash.
 *
 * Uses hardcoded dark-theme colors so it renders correctly even if
 * ThemeProvider itself is the source of the crash.
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
      // In dev mode just reset the state so the tree re-mounts
      this.setState({ hasError: false });
      return;
    }
    try {
      await Updates.reloadAsync();
    } catch {
      // Fallback: just reset state
      this.setState({ hasError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🏓</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app ran into an unexpected error.{'\n'}Please restart and try
            again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={this.handleRestart}
          >
            <Text style={styles.buttonText}>Restart App</Text>
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
    padding: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e6edf5',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8b99ab',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
