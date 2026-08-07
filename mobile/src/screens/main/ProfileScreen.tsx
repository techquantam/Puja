import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import { GuestPlaceholderScreen } from './GuestPlaceholderScreen';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Button } from '../../components/Button';

export const ProfileScreen = ({ navigation }: any) => {
  const { isAuthenticated, user, updateUser, logout } = useAuthStore();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <GuestPlaceholderScreen
        title="Spiritual Profile"
        description="Manage your account profile, delivery addresses, and settings by logging in."
        iconName="person-outline"
      />
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'PM';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleOpenEdit = () => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setIsEditModalVisible(true);
  };

  const handleProfileUpdate = async () => {
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    if (editPhone.trim().length !== 10 || isNaN(Number(editPhone))) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.put('/auth/profile', {
        name: editName.trim(),
        phone: editPhone.trim(),
      });

      const resData = response.data;
      if (resData.success) {
        updateUser(resData.data);
        Alert.alert('Success', 'Profile updated successfully.');
        setIsEditModalVisible(false);
      }
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Unable to update details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userPhone}>+91 {user.phone}</Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          <TouchableOpacity style={styles.optionRow} onPress={handleOpenEdit}>
            <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="create" size={20} color="#1E88E5" />
            </View>
            <Text style={styles.optionLabel}>Edit Profile Information</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('Address')}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="location" size={20} color="#FB8C00" />
            </View>
            <Text style={styles.optionLabel}>Saved Delivery Addresses</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('Orders')}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="receipt" size={20} color="#43A047" />
            </View>
            <Text style={styles.optionLabel}>My Order History</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.signOutBtn}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Full Name *"
              value={editName}
              onChangeText={setEditName}
              style={styles.input}
              placeholderTextColor={COLORS.textLight}
            />

            <TextInput
              placeholder="10-digit Phone Number *"
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="numeric"
              maxLength={10}
              style={styles.input}
              placeholderTextColor={COLORS.textLight}
            />

            <Button
              title="Save Changes"
              onPress={handleProfileUpdate}
              loading={isSubmitting}
              style={{ marginTop: SIZES.md }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.md,
    alignItems: 'center',
  },
  avatarCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.md,
    alignItems: 'center',
    width: '100%',
    marginBottom: SIZES.lg,
    ...SHADOWS.small,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  optionsList: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    width: '100%',
    overflow: 'hidden',
    marginBottom: SIZES.xl,
    ...SHADOWS.small,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  signOutBtn: {
    width: '100%',
    borderColor: '#FFCDD2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.md,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SIZES.sm,
    height: 48,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: SIZES.sm,
  },
});
