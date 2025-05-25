import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatbotWidget from '../../components/chatbot/ChatbotWidget';

// Mock environment variables before tests

beforeAll(() => {
  process.env = {
    ...process.env,
    VITE_CHATBOT_AGENT_ID: 'test-agent-id',
    VITE_CHATBOT_PROJECT_ID: 'test-project-id'
  };
});



describe('ChatbotWidget', () => {
  beforeEach(() => {
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

  test('shows and auto-closes tooltip', async () => {
    render(<ChatbotWidget />);
    const script = document.querySelector('script[src*="df-messenger.js"]');
    
    // Simulate successful script load
    script?.dispatchEvent(new Event('load'));
    
    // Advance timers and check tooltip
    jest.advanceTimersByTime(4000);
    expect(document.querySelector('.df-messenger-tooltip')).toBeInTheDocument();
    
    // Check tooltip auto-closes
    jest.advanceTimersByTime(8000);
    expect(document.querySelector('.df-messenger-tooltip')).not.toBeInTheDocument();
  });

  test('cleans up tooltip on unmount', () => {
    const { unmount } = render(<ChatbotWidget />);
    const script = document.querySelector('script[src*="df-messenger.js"]');
    script?.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(4000);

    unmount();
    expect(document.querySelector('.df-messenger-tooltip')).not.toBeInTheDocument();
  });
});