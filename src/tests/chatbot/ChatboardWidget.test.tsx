import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatbotWidget from '../../components/chatbot/ChatbotWidget';

describe('ChatbotWidget', () => {
  beforeEach(() => {
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

  test('shows and auto-closes tooltip', () => {
    render(<ChatbotWidget />);
    const script = document.querySelector('script[src*="df-messenger.js"]');
    script?.dispatchEvent(new Event('load'));

    jest.advanceTimersByTime(4000);
    expect(document.querySelector('.df-messenger-tooltip')).toBeInTheDocument();

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
//Important Note:
//This widget has a diferrent repo to run the tests but if you wish th soee the code cover rage do the following
//Add this to jest.config.js

//"test:coverage": "vitest run --coverage"
 //"test": "vitest",
 //ANd run the following command
 //npx vitest run --coverage src/tests/chatbot/ChatboardWidget.test.tsx --run