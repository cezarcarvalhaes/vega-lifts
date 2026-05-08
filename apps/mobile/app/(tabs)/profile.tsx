import { useAuth, useUser } from '@clerk/clerk-expo'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export default function ProfileTab() {
  const { signOut } = useAuth()
  const { user } = useUser()

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
      <Pressable style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', gap: 16 },
  email: { color: '#888', fontSize: 14 },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  buttonText: { color: '#fff', fontSize: 16 },
})
