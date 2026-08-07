import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, SIZES } from '../../constants/theme';

type OtpScreenRouteProp = RouteProp<AuthStackParamList, 'Otp'>;

type OtpScreenProps = {
  route: OtpScreenRouteProp;
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Otp'>;
};

export const OtpScreen: React.FC<OtpScreenProps> = ({ route, navigation }) => {
  const { contact, purpose } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const loginUser = useAuthStore((state) => state.login);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Validation Error', 'Please enter a 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      if (purpose === 'verify') {
        const response = await apiClient.post('/auth/verify-otp', {
          contact,
          code,
        });

        const resData = response.data;
        if (resData.success) {
          Alert.alert('Verification Success', 'Your account is verified successfully.', [
            {
              text: 'Go to App',
              onPress: async () => {
                await loginUser(
                  resData.data.user,
                  resData.data.accessToken,
                  resData.data.refreshToken
                );
              },
            },
          ]);
        }
      } else {
        // purpose === 'recovery'
        // Just verify locally and pass validation to reset page
        setLoading(false);
        navigation.navigate('ResetPassword', { contact, code });
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'OTP verification failed.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/resend-otp', { contact });
      if (response.data.success) {
        setTimer(60);
        Alert.alert('Success', 'A new OTP has been sent successfully.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LoadingOverlay visible={loading} message="Verifying code..." />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Enter OTP Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to {contact}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setCode}
            value={code}
            style={styles.otpInput}
            error={code.length > 0 && code.length !== 6 ? 'OTP must be 6 digits' : undefined}
          />

          <Button
            title="Verify Code"
            onPress={handleVerify}
            variant="primary"
            style={styles.verifyBtn}
          />

          <View style={styles.timerContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend code in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendText}>Resend OTP Code</Text>
              </TouchableOpacity>
            )}
          </View>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    height: 60,
  },
  verifyBtn: {
    width: '100%',
    marginTop: SIZES.md,
  },
  timerContainer: {
    marginTop: SIZES.xl,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
