import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import {Input} from '../Input';
import {UserContext} from '../../../utils';

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

const user = {id: 'user-id'};

describe('Input', () => {
  const mockOnSendPress = jest.fn();
  const mockOnStopPress = jest.fn();
  const mockOnContinuePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderInput = (props = {}) =>
    render(
      <UserContext.Provider value={user}>
        <Input onSendPress={mockOnSendPress} {...props} />
      </UserContext.Provider>,
    );

  it('shows continue button when stopped_eos is 0 and onContinuePress is provided', () => {
    const {getByTestId} = renderInput({
      stopped_eos: 0,
      onContinuePress: mockOnContinuePress,
    });

    expect(getByTestId('continue-button')).toBeTruthy();
  });

  it('hides continue button when stopped_eos is 1', () => {
    const {queryByTestId} = renderInput({
      stopped_eos: 1,
      onContinuePress: mockOnContinuePress,
    });

    expect(queryByTestId('continue-button')).toBeNull();
  });

  it('hides continue button when onContinuePress is not provided', () => {
    const {queryByTestId} = renderInput({
      stopped_eos: 0,
    });

    expect(queryByTestId('continue-button')).toBeNull();
  });

  it('calls onContinuePress when continue button is pressed', () => {
    const {getByTestId} = renderInput({
      stopped_eos: 0,
      onContinuePress: mockOnContinuePress,
    });

    fireEvent.press(getByTestId('continue-button'));
    expect(mockOnContinuePress).toHaveBeenCalledTimes(1);
  });

  it('shows both stop and continue buttons when appropriate', () => {
    const {getByTestId} = renderInput({
      stopped_eos: 0,
      onContinuePress: mockOnContinuePress,
      isStopVisible: true,
      onStopPress: mockOnStopPress,
    });

    expect(getByTestId('continue-button')).toBeTruthy();
    expect(getByTestId('stop-button')).toBeTruthy();
  });
});
