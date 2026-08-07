import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, secureTextEntry = false, style, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            !!error && styles.inputError,
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.textInput, style]}
            placeholderTextColor={COLORS.textLight}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={styles.eyeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeText}>
                {isPasswordVisible ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.sm,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  inputContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.md,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 16,
  },
  eyeButton: {
    padding: SIZES.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SIZES.xs,
    fontWeight: '500',
  },
});
