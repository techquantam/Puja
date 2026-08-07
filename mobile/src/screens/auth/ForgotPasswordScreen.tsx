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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { apiClient } from '../../api/client';
import { COLORS, SIZES } from '../../constants/theme';

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

const forgotSchema = z.object({
  contact: z.string().min(1, 'Email or Phone is required').refine((val) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const isPhone = /^\+?[0-9]{10,14}$/.test(val);
    return isEmail || isPhone;
  }, 'Please enter a valid email or phone number'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      contact: '',
    },
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/forgot-password', {
        contact: data.contact,
      });

      if (response.data.success) {
        Alert.alert(
          'Recovery OTP Sent',
          'We have sent a verification code to reset your password if this account is registered.',
          [
            {
              text: 'Reset Password',
              onPress: () =>
                navigation.navigate('Otp', {
                  contact: data.contact,
                  purpose: 'recovery',
                }),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LoadingOverlay visible={loading} message="Sending recovery OTP..." />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Recovery Account</Text>
          <Text style={styles.subtitle}>
            Enter your registered email address or phone number to retrieve your account credentials
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="contact"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email or Phone Number"
                placeholder="Enter email or mobile number"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.contact?.message}
              />
            )}
          />

          <Button
            title="Send Recovery OTP"
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
