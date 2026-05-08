import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    if (!isLoaded)
      return
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/(tabs)')
      }
      else {
        Alert.alert('Sign in incomplete', `Additional step required: ${result.status}. Disable MFA on your account to sign in here.`)
      }
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      Alert.alert('Sign in failed', message)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Vega Lifts</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} onPress={handleSignIn} disabled={loading}>
          {loading
            ? (
                <ActivityIndicator color="#fff" />
              )
            : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
        </Pressable>
        <Link href="/(auth)/sign-up" style={styles.link}>
          Don't have an account? Sign up
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  inner: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 16, textAlign: 'center' },
  input: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e84545',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#888', textAlign: 'center', marginTop: 8 },
})
