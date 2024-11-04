import * as React from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {useTheme} from '../../hooks';

export interface ContinueButtonPropsAdditionalProps {
  touchableOpacityProps?: TouchableOpacityProps;
}

export interface ContinueButtonProps
  extends ContinueButtonPropsAdditionalProps {
  onPress: () => void;
  visible?: boolean;
}

export const ContinueButton = ({
  onPress,
  touchableOpacityProps,
  visible = true,
}: ContinueButtonProps) => {
  const theme = useTheme();

  const handlePress = (event: GestureResponderEvent) => {
    onPress();
    touchableOpacityProps?.onPress?.(event);
  };

  if (!visible) {
    return null;
  }

  return (
    <TouchableOpacity
      accessibilityLabel="Continue generation"
      accessibilityRole="button"
      testID="continue-button"
      {...touchableOpacityProps}
      onPress={handlePress}
      style={styles.continueButton}>
      <Icon name="play-arrow" size={24} color={theme.colors.inverseOnSurface} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  continueButton: {
    marginLeft: 16,
  },
});
