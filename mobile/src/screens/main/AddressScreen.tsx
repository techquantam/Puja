import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Button } from '../../components/Button';

interface AddressItem {
  _id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export const AddressScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Fetch saved addresses
  const { data: addresses = [], isLoading, refetch } = useQuery<AddressItem[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await apiClient.get('/addresses');
      return response.data.data || [];
    },
  });

  // Mutators
  const addAddressMutation = useMutation({
    mutationFn: async (newAddr: any) => {
      return await apiClient.post('/addresses', newAddr);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      Alert.alert('Success', 'Address added successfully.');
      resetForm();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to add address.');
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, updatedData }: { id: string; updatedData: any }) => {
      return await apiClient.put(`/addresses/${id}`, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      Alert.alert('Success', 'Address updated successfully.');
      resetForm();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update address.');
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      Alert.alert('Success', 'Address deleted successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to delete address.');
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.patch(`/addresses/${id}/default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to set default address.');
    },
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setStreet('');
    setCity('');
    setState('');
    setPincode('');
    setIsDefault(false);
    setEditingAddressId(null);
    setIsFormVisible(false);
  };

  const handleEdit = (addr: AddressItem) => {
    setName(addr.name);
    setPhone(addr.phone);
    setStreet(addr.street);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setIsDefault(addr.isDefault);
    setEditingAddressId(addr._id);
    setIsFormVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddressMutation.mutate(id) },
    ]);
  };

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim() || !street.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      Alert.alert('Validation Error', 'Please fill all required address fields.');
      return;
    }

    if (phone.trim().length !== 10 || isNaN(Number(phone))) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (pincode.trim().length !== 6 || isNaN(Number(pincode))) {
      Alert.alert('Validation Error', 'Please enter a valid 6-digit PIN code.');
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault,
    };

    if (editingAddressId) {
      updateAddressMutation.mutate({ id: editingAddressId, updatedData: payload });
    } else {
      addAddressMutation.mutate(payload);
    }
  };

  const renderAddressCard = ({ item }: { item: AddressItem }) => (
    <View style={[styles.card, item.isDefault && styles.defaultCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionIcon}>
          <Ionicons name="create-outline" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <Text style={styles.cardPhone}>Mobile: +91 {item.phone}</Text>
      <Text style={styles.cardText}>
        {item.street}, {item.city}, {item.state} - {item.pincode}
      </Text>

      <View style={styles.cardActions}>
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setDefaultAddressMutation.mutate(item._id)}
          >
            <Text style={styles.actionBtnText}>Set as Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { marginLeft: 'auto' }]}
          onPress={() => handleDelete(item._id)}
        >
          <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isFormVisible ? (
        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>
            {editingAddressId ? 'Update Delivery Address' : 'Add New Delivery Address'}
          </Text>

          <TextInput
            placeholder="Recipient Full Name *"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            placeholder="10-digit Phone Number *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="numeric"
            maxLength={10}
            style={styles.input}
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            placeholder="Street Address, Area, Flat No. *"
            value={street}
            onChangeText={setStreet}
            multiline
            numberOfLines={2}
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            placeholder="City / District *"
            value={city}
            onChangeText={setCity}
            style={styles.input}
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            placeholder="State *"
            value={state}
            onChangeText={setState}
            style={styles.input}
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            placeholder="6-digit PIN Code *"
            value={pincode}
            onChangeText={setPincode}
            keyboardType="numeric"
            maxLength={6}
            style={styles.input}
            placeholderTextColor={COLORS.textLight}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Set as Default Shipping Address</Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: COLORS.border, true: '#FF7F0080' }}
              thumbColor={isDefault ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <Button
              title="Save Address"
              onPress={handleSubmit}
              loading={addAddressMutation.isPending || updateAddressMutation.isPending}
              style={styles.saveBtn}
            />
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={addresses}
              renderItem={renderAddressCard}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={80} color={COLORS.border} />
                  <Text style={styles.emptyText}>No saved delivery addresses found.</Text>
                </View>
              }
            />
          )}

          <View style={styles.footer}>
            <Button
              title="Add New Address"
              onPress={() => setIsFormVisible(true)}
              style={styles.addBtn}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SIZES.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  defaultCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFBF7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SIZES.sm,
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#2E7D32',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardPhone: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#4A3E3D',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 12,
    paddingTop: 8,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionIcon: {
    padding: 4,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: SIZES.sm,
  },
  footer: {
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addBtn: {
    width: '100%',
  },
  formContainer: {
    padding: SIZES.md,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SIZES.sm,
    height: 48,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.md,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  cancelBtnText: {
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1.2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
});
