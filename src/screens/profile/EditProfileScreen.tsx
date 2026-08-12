import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { TextField } from '../../components/forms/TextField';
import { Button } from '../../components/buttons/Button';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const t = useTheme();
  const [name, setName] = useState('Selam Tesfaye');
  const [email, setEmail] = useState('selam@example.com');
  const [targetScore, setTargetScore] = useState('550 and above');

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Edit Profile" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <TextField label="Full name" value={name} onChangeText={setName} />
        <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Target score" value={targetScore} onChangeText={setTargetScore} />
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button label="Save Changes" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
