import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '../lib/clerk';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, Component, ReactNode } from 'react';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { colors } from '../constants/theme';
import { useBillsStore } from '../stores/billsStore';

enableScreens();
SplashScreen.preventAutoHideAsync();

// ─── Error Boundary ────────────────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error: Error | null }
class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <ScrollView contentContainerStyle={errStyles.container}>
          <Text style={errStyles.title}>Something went wrong</Text>
          <Text style={errStyles.message}>{this.state.error?.message}</Text>
          <Text style={errStyles.stack}>{this.state.error?.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
const errStyles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 18, fontWeight: '700', color: '#dc2626', marginBottom: 12 },
  message: { fontSize: 14, color: '#111', marginBottom: 16, fontWeight: '600' },
  stack: { fontSize: 11, color: '#555', fontFamily: 'monospace' },
});
// ──────────────────────────────────────────────────────────────────────────────

function AuthGuard() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const setClerkToken = useBillsStore((s) => s.setClerkToken);

  useEffect(() => {
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments]);

  useEffect(() => {
    if (!isSignedIn) {
      setClerkToken(null);
      return;
    }
    const refreshToken = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) setClerkToken(token);
      } catch (e) {
        console.warn('Failed to get Supabase token from Clerk:', e);
      }
    };
    refreshToken();
    const interval = setInterval(refreshToken, 50 * 1000);
    return () => clearInterval(interval);
  }, [isSignedIn, getToken, setClerkToken]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
          tokenCache={tokenCache}
        >
          <AuthGuard />
        </ClerkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
