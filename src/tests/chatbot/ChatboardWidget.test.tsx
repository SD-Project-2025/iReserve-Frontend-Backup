// ChatboardWidget.test.tsx
import { render, cleanup, waitFor } from '@testing-library/react';
import ChatbotWidget from '../../components/chatbot/ChatbotWidget';

describe('ChatbotWidget', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env = {
      ...process.env,
      VITE_CHATBOT_AGENT_ID: 'test-agent-id',
      VITE_CHATBOT_PROJECT_ID: 'test-project-id'
    };

    jest.useFakeTimers();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    cleanup();
  });

  test('adds Dialogflow stylesheet to head', () => {
    render(<ChatbotWidget />);
    const link = document.querySelector('link[href*="df-messenger-default.css"]');
    expect(link).toBeInTheDocument();
  });

  test('loads Dialogflow script in body', () => {
    render(<ChatbotWidget />);
    const script = document.querySelector('script[src*="df-messenger.js"]');
    expect(script).toBeInTheDocument();
    expect(script).toHaveAttribute('async');
  });

  test('creates df-messenger element after script load', async () => {
    render(<ChatbotWidget />);
    const script = document.querySelector('script[src*="df-messenger.js"]');
    script?.dispatchEvent(new Event('load'));

    await waitFor(() => {
      const dfMessenger = document.querySelector('df-messenger');
      expect(dfMessenger).toBeInTheDocument();
      expect(dfMessenger).toHaveAttribute('project-id', 'test-project-id');
      expect(dfMessenger).toHaveAttribute('agent-id', 'test-agent-id');
    });
  });

  test('shows and auto-closes tooltip', () => {
    render(<ChatbotWidget />);
    const script = document.querySelector('script[src*="df-messenger.js"]');
    script?.dispatchEvent(new Event('load'));

    jest.advanceTimersByTime(4000);
    expect(document.querySelector('.df-messenger-tooltip')).toBeInTheDocument();

    jest.advanceTimersByTime(8000);
    expect(document.querySelector('.df-messenger-tooltip')).not.toBeInTheDocument();
  });

  test('shows tooltip on hover and closes on mouse leave', () => {
    render(<ChatbotWidget />);
    const script = document.querySelector('script[src*="df-messenger.js"]');
    script?.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(1000); // Allow hover setup

    const chatButton = document.querySelector('df-messenger-chat-bubble button');
    chatButton?.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.querySelector('.df-messenger-tooltip')).toBeInTheDocument();

    chatButton?.dispatchEvent(new MouseEvent('mouseleave'));
    jest.advanceTimersByTime(1000);
    expect(document.querySelector('.df-messenger-tooltip')).not.toBeInTheDocument();
  });

  test('cleans up tooltip on unmount', () => {
    const { unmount } = render(<ChatbotWidget />);
    const script = document.querySelector('script[src*="df-messenger.js"]');
    script?.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(4000); // Show tooltip

    unmount();
    expect(document.querySelector('.df-messenger-tooltip')).not.toBeInTheDocument();
  });
});