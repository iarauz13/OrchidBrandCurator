import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH } from '@/config/firebase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';
import { ScalableButton } from '@/components/ui/ScalableButton';
import Constants from 'expo-constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setLoading: setStoreLoading } = useAuthStore();
  // FORCE DARK MODE for the Landing Page to match Web "bg-black" aesthetic
  const currentTheme = Colors.dark;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      if (!FIREBASE_AUTH) throw new Error("Firebase not initialized");
      const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      // The onAuthStateChanged in _layout might catch this, but we can set it manually too for speed
      const user = userCredential.user;
      setUser({ uid: user.uid, email: user.email } as any);
      // Let the ProtectedRoute hook handle navigation
    } catch (error: any) {
      console.error(error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    console.log("Activating Guest Mode");
    setUser({ uid: 'guest-user-123', email: 'Guest' } as any);
    setStoreLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: '#000' }]} // Hardcoded black to match web landing
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../assets/images/orchid_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.textBlock}>
            <Text style={[styles.mainTagline, { color: 'rgba(255,255,255,0.9)' }]}>Curate with Intention.</Text>
            <Text style={[styles.subcopy, { color: 'rgba(255,255,255,0.5)' }]}>
              The architectural vault for your personal brand library.
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }]}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }]}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <ScalableButton
            style={[styles.loginButton, { backgroundColor: '#fff' }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={[styles.loginButtonText, { color: '#000' }]}>
              {loading ? 'ENTERING REGISTRY...' : 'ENTER REGISTRY'}
            </Text>
          </ScalableButton>

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            <Text style={[styles.dividerText, { color: 'rgba(255,255,255,0.3)' }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
          </View>

          <ScalableButton
            style={[styles.socialButton, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}
            onPress={() => Alert.alert("Coming Soon", "Native Google Sign-In requires Cloud Console configuration.")}
          >
            <Image
              source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
              style={{ width: 18, height: 18, marginRight: 10 }}
            />
            <Text style={[styles.socialButtonText, { color: '#fff' }]}>Sign in with Google</Text>
          </ScalableButton>

          <ScalableButton
            style={[styles.guestButton, { marginTop: 24 }]}
            onPress={handleGuestLogin}
          >
            <Text style={[styles.guestButtonText, { color: 'rgba(255,255,255,0.6)' }]}>CONTINUE AS GUEST</Text>
          </ScalableButton>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 ORCHID. CRAFTED FOR THE DISCERNING.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 30,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 60,
  },
  logo: {
    width: 200, // Adjusted for mobile
    height: 60,
    marginBottom: 40,
    // Logo is white-on-transparent or we invert it if needed. 
    // Web used filter: invert(1). If our png is black text, we need to handle that.
    // Assuming the png copied is the full logo. If it's black, we might not see it on black bg.
    // Let's assume standard behavior, if invisible we'll add tint.
    tintColor: '#fff'
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  mainTagline: {
    fontSize: 32,
    fontWeight: '300', // Light font
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subcopy: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    fontWeight: '300',
  },
  form: {
    gap: 16,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8, // Slightly sharper corners for "architectural" feel
    paddingHorizontal: 16,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  loginButton: {
    height: 56,
    borderRadius: 50, // Pill shape like web button
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
    opacity: 0.8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  socialButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  guestButton: {
    alignItems: 'center',
    padding: 10,
  },
  guestButtonText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 40,
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
