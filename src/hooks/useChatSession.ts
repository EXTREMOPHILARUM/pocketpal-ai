import React, {useRef, useCallback, useState, useEffect} from 'react';

import {toJS} from 'mobx';
import {LlamaContext} from '@pocketpalai/llama.rn';
import throttle from 'lodash.throttle';

import {randId} from '../utils';
import {L10nContext} from '../utils';
import {chatSessionStore, modelStore} from '../store';

import {MessageType, User} from '../utils/types';
import {applyChatTemplate, convertToChatMessages} from '../utils/chat';

export const useChatSession = (
  context: LlamaContext | undefined,
  currentMessageInfo: React.MutableRefObject<{
    createdAt: number;
    id: string;
  } | null>,
  messages: MessageType.Any[],
  user: User,
  assistant: User,
) => {
  const [inferencing, setInferencing] = useState<boolean>(false);
  const [stopped_eos, setStopped_eos] = useState<number>(1);
  const l10n = React.useContext(L10nContext);
  const conversationIdRef = useRef<string>(randId());
  const lastPromptRef = useRef<string>('');

  // Initialize stopped_eos from the last message's metadata
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[0];
      if (lastMessage.type === 'text') {
        setStopped_eos(lastMessage.metadata?.stopped_eos ?? 1);
      }
    } else {
      setStopped_eos(1);
    }
  }, [messages]);

  // We needed this to avoid excessive ui updates. Unsure if this is the best way to do it.
  const tokenBufferRef = useRef<string>(''); // Token buffer to accumulate tokens
  const updateInterval = 150; // Interval for flushing token buffer (in ms)

  // Function to flush the token buffer and update the chat message
  const flushTokenBuffer = useCallback(
    (createdAt: number, id: string) => {
      if (tokenBufferRef.current.length > 0 && context) {
        chatSessionStore.updateMessageToken(
          {token: tokenBufferRef.current},
          createdAt,
          id,
          context,
        );
        tokenBufferRef.current = ''; // Reset the token buffer
      }
    },
    [context],
  );

  // Throttled version of flushTokenBuffer to prevent excessive updates
  const throttledFlushTokenBuffer = throttle(
    (createdAt: number, id: string) => {
      flushTokenBuffer(createdAt, id);
    },
    updateInterval,
  );

  const addMessage = (message: MessageType.Any) => {
    chatSessionStore.addMessageToCurrentSession(message);
  };

  const addSystemMessage = (text: string, metadata = {}) => {
    const textMessage: MessageType.Text = {
      author: assistant,
      createdAt: Date.now(),
      id: randId(),
      text,
      type: 'text',
      metadata: {system: true, ...metadata},
    };
    addMessage(textMessage);
  };

  const buildChatMessages = () => {
    return [
      ...(modelStore.activeModel?.chatTemplate?.systemPrompt
        ? [
            {
              role: 'system' as 'system',
              content: modelStore.activeModel.chatTemplate.systemPrompt,
            },
          ]
        : []),
      ...convertToChatMessages(messages),
    ];
  };

  const handleSendPress = async (message: MessageType.PartialText) => {
    if (!context) {
      addSystemMessage(l10n.modelNotLoaded);
      return;
    }

    const textMessage: MessageType.Text = {
      author: user,
      createdAt: Date.now(),
      id: randId(),
      text: message.text,
      type: 'text',
      metadata: {
        contextId: context.id,
        conversationId: conversationIdRef.current,
        copyable: true,
      },
    };
    addMessage(textMessage);
    setInferencing(true);
    setStopped_eos(1); // Reset stopped_eos when starting new message

    const id = randId();
    const createdAt = Date.now();
    currentMessageInfo.current = {createdAt, id};

    const chatMessages = [
      ...buildChatMessages(),
      {
        role: 'user' as 'user',
        content: message.text,
      },
    ];

    const prompt = await applyChatTemplate(
      chatMessages,
      modelStore.activeModel ?? null,
      context,
    );
    lastPromptRef.current = prompt;

    const completionParams = toJS(modelStore.activeModel?.completionSettings);

    try {
      const result = await context.completion(
        {...completionParams, prompt},
        data => {
          if (data.token && currentMessageInfo.current) {
            tokenBufferRef.current += data.token;
            throttledFlushTokenBuffer(
              currentMessageInfo.current.createdAt,
              currentMessageInfo.current.id,
            );
          }
        },
      );

      if (
        currentMessageInfo.current?.createdAt &&
        currentMessageInfo.current?.id
      ) {
        flushTokenBuffer(
          currentMessageInfo.current.createdAt,
          currentMessageInfo.current.id,
        );
      }

      console.log('result: ', result);
      const newStopped_eos = result.stopped_eos ? 1 : 0;
      setStopped_eos(newStopped_eos);
      chatSessionStore.updateMessage(id, {
        metadata: {
          timings: result.timings,
          copyable: true,
        },
      });
      setInferencing(false);
    } catch (error) {
      setInferencing(false);
      setStopped_eos(1); // Reset on error
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('network')) {
        addSystemMessage(l10n.networkError);
      } else {
        addSystemMessage(`Completion failed: ${errorMessage}`);
      }
    }
  };

  const handleContinuePress = async () => {
    if (!context) {
      return;
    }

    setInferencing(true);
    setStopped_eos(1); // Reset stopped_eos when continuing
    const id = randId();
    const createdAt = Date.now();
    currentMessageInfo.current = {createdAt, id};

    // Build chat messages with full context
    const chatMessages = buildChatMessages();
    const prompt = await applyChatTemplate(
      chatMessages,
      modelStore.activeModel ?? null,
      context,
    );

    const completionParams = toJS(modelStore.activeModel?.completionSettings);

    try {
      const result = await context.completion(
        {...completionParams, prompt},
        data => {
          if (data.token && currentMessageInfo.current) {
            tokenBufferRef.current += data.token;
            throttledFlushTokenBuffer(
              currentMessageInfo.current.createdAt,
              currentMessageInfo.current.id,
            );
          }
        },
      );

      if (
        currentMessageInfo.current?.createdAt &&
        currentMessageInfo.current?.id
      ) {
        flushTokenBuffer(
          currentMessageInfo.current.createdAt,
          currentMessageInfo.current.id,
        );
      }

      const newStopped_eos = result.stopped_eos ? 1 : 0;
      setStopped_eos(newStopped_eos);
      chatSessionStore.updateMessage(id, {
        metadata: {
          timings: result.timings,
          copyable: true,
        },
      });
      setInferencing(false);
    } catch (error) {
      setInferencing(false);
      setStopped_eos(1); // Reset on error
      const errorMessage = (error as Error).message;
      addSystemMessage(`Continuation failed: ${errorMessage}`);
    }
  };

  const handleResetConversation = () => {
    conversationIdRef.current = randId();
    addSystemMessage(l10n.conversationReset);
  };

  const handleStopPress = () => {
    if (inferencing && context) {
      context.stopCompletion();
      setStopped_eos(0); // Set to 0 when manually stopping
    }
    if (
      currentMessageInfo.current?.createdAt &&
      currentMessageInfo.current?.id
    ) {
      flushTokenBuffer(
        currentMessageInfo.current.createdAt,
        currentMessageInfo.current.id,
      );
    }
  };

  return {
    handleSendPress,
    handleResetConversation,
    handleStopPress,
    handleContinuePress,
    inferencing,
    stopped_eos,
  };
};
