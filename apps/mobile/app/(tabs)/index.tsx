import { StyleSheet, Text, View } from 'react-native'

export default function WorkoutTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Workout logging — Phase 1</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  text: { color: '#888', fontSize: 16 },
})
