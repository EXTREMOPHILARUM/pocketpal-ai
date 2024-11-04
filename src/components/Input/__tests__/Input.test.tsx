import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import {Input} from '../Input';
import {L10nContext, UserContext} from '../../../utils';
import {l10n} from '../../../utils/l10n';

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

const user = {id: 'user-id'};
const mockL10n = l10n.en;

describe('Input', () => {
  const mockOnSendPress = jest.fn();
  const mockOnStopPress = jest.fn();
  const mockOnContinuePress = jest.fn();
  const mockOnAttachmentPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderInput = (props = {}) =>
    render(
      <L10nContext.Provider value={mockL10n}>
        <UserContext.Provider value={user}>
          <Input onSendPress={mockOnSendPress} {...props} />
        </UserContext.Provider>
      </L10nContext.Provider>,
    );

  describe('Text Input', () => {
    it('updates value when text changes', () => {
      const {getByPlaceholderText} = renderInput();
      const input = getByPlaceholderText(mockL10n.inputPlaceholder);
      fireEvent.changeText(input, 'Hello');
      expect(input.props.value).toBe('Hello');
    });

    it('handles custom text input props', () => {
      const customProps = {
        placeholder: 'Custom placeholder',
        style: {height: 100},
      };
      const {getByPlaceholderText} = renderInput({
        textInputProps: customProps,
      });
      const input = getByPlaceholderText('Custom placeholder');
      expect(input.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({height: 100})]),
      );
    });

    it('maintains controlled value when provided', () => {
      const {getByPlaceholderText} = renderInput({
        textInputProps: {
          value: 'Controlled value',
          onChangeText: jest.fn(),
        },
      });
      const input = getByPlaceholderText(mockL10n.inputPlaceholder);
      expect(input.props.value).toBe('Controlled value');
    });
  });

  describe('Send Button', () => {
    it('shows send button when text is not empty in editing mode', async () => {
      const {getByPlaceholderText, findByTestId} = renderInput({
        sendButtonVisibilityMode: 'editing',
      });
      const input = getByPlaceholderText(mockL10n.inputPlaceholder);
      fireEvent.changeText(input, 'Hello');
      const sendButton = await findByTestId('send-button');
      expect(sendButton).toBeTruthy();
    });

    it('hides send button when text is empty in editing mode', () => {
      const {queryByTestId} = renderInput({
        sendButtonVisibilityMode: 'editing',
      });
      expect(queryByTestId('send-button')).toBeNull();
    });

    it('always shows send button in always mode', () => {
      const {getByTestId} = renderInput({
        sendButtonVisibilityMode: 'always',
      });
      expect(getByTestId('send-button')).toBeTruthy();
    });

    it('calls onSendPress with trimmed text when send button is pressed', () => {
      const {getByPlaceholderText, getByTestId} = renderInput({
        sendButtonVisibilityMode: 'always',
      });
      const input = getByPlaceholderText(mockL10n.inputPlaceholder);
      fireEvent.changeText(input, '  Hello  ');
      fireEvent.press(getByTestId('send-button'));
      expect(mockOnSendPress).toHaveBeenCalledWith({
        text: 'Hello',
        type: 'text',
      });
      expect(input.props.value).toBe('');
    });
  });

  describe('Attachment Button', () => {
    it('shows attachment button when onAttachmentPress is provided', () => {
      const {getByTestId} = renderInput({
        onAttachmentPress: mockOnAttachmentPress,
      });
      expect(getByTestId('attachment-button')).toBeTruthy();
    });

    it('hides attachment button when onAttachmentPress is not provided', () => {
      const {queryByTestId} = renderInput();
      expect(queryByTestId('attachment-button')).toBeNull();
    });

    it('shows activity indicator when attachment is uploading', () => {
      const {getByTestId, queryByTestId} = renderInput({
        onAttachmentPress: mockOnAttachmentPress,
        isAttachmentUploading: true,
      });
      expect(getByTestId('CircularActivityIndicator')).toBeTruthy();
      expect(queryByTestId('attachment-button')).toBeNull();
    });

    it('calls onAttachmentPress when attachment button is pressed', () => {
      const {getByTestId} = renderInput({
        onAttachmentPress: mockOnAttachmentPress,
      });
      fireEvent.press(getByTestId('attachment-button'));
      expect(mockOnAttachmentPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stop Button', () => {
    it('shows stop button when isStopVisible is true', () => {
      const {getByTestId} = renderInput({
        isStopVisible: true,
        onStopPress: mockOnStopPress,
      });
      expect(getByTestId('stop-button')).toBeTruthy();
    });

    it('hides stop button when isStopVisible is false', () => {
      const {queryByTestId} = renderInput({
        isStopVisible: false,
        onStopPress: mockOnStopPress,
      });
      expect(queryByTestId('stop-button')).toBeNull();
    });

    it('calls onStopPress when stop button is pressed', () => {
      const {getByTestId} = renderInput({
        isStopVisible: true,
        onStopPress: mockOnStopPress,
      });
      fireEvent.press(getByTestId('stop-button'));
      expect(mockOnStopPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Continue Button', () => {
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
});
