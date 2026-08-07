import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { apiClient } from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';

type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

type ResetPasswordScreenProps = {
  route: ResetPasswordScreenRouteProp;
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
};

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  route,
  navigation,
}) => {
  const { contact, code } = route.params;
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetFormValues) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/reset-password', {
        contact,
        code,
        newPassword: data.password,
      });

      if (response.data.success) {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been changed. Please login with your new credentials.',
          [
            {
              text: 'Login',
              onPress: () => navigation.navigate('Login', { contact }),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LoadingOverlay visible={loading} message="Updating password..." />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>New Credentials</Text>
          <Text style={styles.subtitle}>
            Create a secure password for account recovery. Choose at least 6 characters.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                placeholder="Enter new password"
                secureTextEntry
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Confirm new password"
                secureTextEntry
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title="Reset Password"
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            style={styles.submitBtn}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SIZES.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: SIZES.xs,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginTop: SIZES.md,
  },
});
