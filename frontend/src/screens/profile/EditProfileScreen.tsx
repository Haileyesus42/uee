import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { TopBar } from '../../components/navigation/TopBar';
import { TextField } from '../../components/forms/TextField';
import { Button } from '../../components/buttons/Button';
import { Card } from '../../components/cards/Card';
import { Avatar } from '../../components/common/Avatar';
import { GradeSelector } from '../../components/learn/GradeSelector';
import { Grade } from '../../data/curriculum';
import { useMe, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '../../hooks/useProfile';
import { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

const AVATAR_SIZE = 96;

export function EditProfileScreen({ navigation }: Props) {
  const t = useTheme();
  const { data: profile } = useMe();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade>(9);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setGrade(profile.grade as Grade);
    }
  }, [profile]);

  const dirty = profile != null && (name !== profile.name || grade !== profile.grade);

  async function handleSave() {
    await updateProfile.mutateAsync({ name, grade });
    navigation.goBack();
  }

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to set a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    uploadAvatar.mutate(
      { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
      { onError: () => Alert.alert('Upload failed', 'Could not upload that photo — try again.') }
    );
  }

  const avatarBusy = uploadAvatar.isPending || removeAvatar.isPending;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.colors.bg }]} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.md }}>
        <TopBar title="Edit Profile" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.md, paddingBottom: t.spacing.xl }} keyboardShouldPersistTaps="handled">
        <Card style={styles.identityCard}>
          <Pressable onPress={pickAvatar} disabled={avatarBusy} style={{ opacity: avatarBusy ? 0.5 : 1 }}>
            <Avatar
              userId={profile?.id ?? ''}
              hasPhoto={profile?.hasAvatarPhoto ?? false}
              emoji={profile?.avatarEmoji ?? '🧑🎓'}
              size={AVATAR_SIZE}
            />
            <View style={[styles.cameraBadge, { backgroundColor: t.colors.brand, borderColor: t.colors.surface }]}>
              {avatarBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={15} color="#FFFFFF" />
              )}
            </View>
          </Pressable>

          <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginTop: 14 }]}>
            {profile?.name || 'Tizata Student'}
          </Text>
          {profile?.telegramUsername && (
            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 2 }]}>
              @{profile.telegramUsername}
            </Text>
          )}

          {profile?.hasAvatarPhoto && (
            <Pressable onPress={() => removeAvatar.mutate()} disabled={avatarBusy} style={{ marginTop: 12 }}>
              <Text style={[t.typography.caption, { color: t.colors.error, fontWeight: '600' }]}>Remove Photo</Text>
            </Pressable>
          )}
        </Card>

        <SectionLabel>Personal Info</SectionLabel>
        <Card>
          <TextField label="Full name" value={name} onChangeText={setName} placeholder="Your name" />

          <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginBottom: 6 }]}>Grade</Text>
          <GradeSelector grade={grade} onChange={setGrade} />
        </Card>

        {profile?.telegramUsername && (
          <>
            <SectionLabel>Account</SectionLabel>
            <Card style={styles.linkedRow}>
              <View style={[styles.telegramIcon, { backgroundColor: t.colors.secondaryLight }]}>
                <Ionicons name="paper-plane" size={15} color={t.colors.secondary} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[t.typography.bodyStrong, { color: t.colors.textPrimary, fontSize: 14 }]}>
                  Linked to Telegram
                </Text>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 1 }]}>
                  Signed in as @{profile.telegramUsername}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color={t.colors.success} />
            </Card>
          </>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.md, paddingBottom: 12 }}>
        <Button label="Save Changes" onPress={handleSave} disabled={!dirty || updateProfile.isPending} />
      </View>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text style={[t.typography.caption, { color: t.colors.textSecondary, letterSpacing: 0.5, marginTop: 20, marginBottom: 10 }]}>
      {children.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identityCard: { alignItems: 'center', paddingVertical: 24 },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedRow: { flexDirection: 'row', alignItems: 'center' },
  telegramIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
