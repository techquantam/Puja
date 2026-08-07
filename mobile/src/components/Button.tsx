import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = (): ViewStyle[] => {
    const stylesList: ViewStyle[] = [styles.baseButton];

    if (variant === 'primary') {
      stylesList.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      stylesList.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      stylesList.push(styles.outlineButton);
    } else if (variant === 'text') {
      stylesList.push(styles.textButton);
    }

    if (disabled || loading) {
      stylesList.push(styles.disabledButton);
    }

    if (style) {
      stylesList.push(style);
    }

    return stylesList;
  };

  const getLabelStyles = (): TextStyle[] => {
    const stylesList: TextStyle[] = [styles.baseText];

    if (variant === 'primary') {
      stylesList.push(styles.primaryText);
    } else if (variant === 'secondary') {
      stylesList.push(styles.secondaryText);
    } else if (variant === 'outline') {
      stylesList.push(styles.outlineText);
    } else if (variant === 'text') {
      stylesList.push(styles.textText);
    }

    if (disabled) {
      stylesList.push(styles.disabledText);
    }

    if (textStyle) {
      stylesList.push(textStyle);
    }

    return stylesList;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={getButtonStyles()}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'text' ? COLORS.primary : COLORS.white}
        />
      ) : (
        <Text style={getLabelStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 50,
    borderRadius: SIZES.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginVertical: SIZES.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
    height: 40,
    marginVertical: SIZES.xs,
  },
  disabledButton: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  textText: {
    color: COLORS.primary,
  },
  disabledText: {
    color: COLORS.textLight,
  },
});
