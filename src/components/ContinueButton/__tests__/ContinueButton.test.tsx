import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import {ContinueButton} from '../ContinueButton';

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('ContinueButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const {getByTestId} = render(
      <ContinueButton onPress={mockOnPress} visible={true} />,
    );

    expect(getByTestId('continue-button')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const {queryByTestId} = render(
      <ContinueButton onPress={mockOnPress} visible={false} />,
    );

    expect(queryByTestId('continue-button')).toBeNull();
  });

  it('calls onPress when pressed', () => {
    const {getByTestId} = render(
      <ContinueButton onPress={mockOnPress} visible={true} />,
    );

    fireEvent.press(getByTestId('continue-button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('defaults to visible when visible prop is not provided', () => {
    const {getByTestId} = render(<ContinueButton onPress={mockOnPress} />);

    expect(getByTestId('continue-button')).toBeTruthy();
  });
});
