import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { TextField } from '../../components/forms/TextField';
import { Button } from '../../components/buttons/Button';
import { useMe, useUpdateProfile } from '../../hooks/useProfile';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const t = useTheme();
  const { data: profile } = useMe();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState('');

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  async function handleSave() {
    await updateProfile.mutateAsync({ name });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Edit Profile" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <TextField label="Full name" value={name} onChangeText={setName} />
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button label="Save Changes" onPress={handleSave} disabled={updateProfile.isPending} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
