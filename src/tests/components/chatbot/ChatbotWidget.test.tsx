import React from 'react';
import { render, act } from '@testing-library/react';
import ChatbotWidget from './ChatbotWidget';

// Mock document methods
const originalCreateElement = document.createElement;
const originalQuerySelector = document.querySelector;
const originalAppendChild = document.head.appendChild;
const originalBodyAppend = document.body.appendChild;

describe('ChatbotWidget', () => {
  beforeEach(() => {
    // Reset mocks before each test
    document.createElement = jest.fn(originalCreateElement);
    document.querySelector = jest.fn(originalQuerySelector);
    document.head.appendChild = jest.fn(originalAppendChild);
    document.body.appendChild = jest.fn(originalBodyAppend);
    
    // Mock environment variables
    process.env.VITE_CHATBOT_AGENT_ID = 'test-agent-id';
    process.env.VITE_CHATBOT_PROJECT_ID = 'test-project-id';
  });

  afterEach(() => {
    // Clean up and restore original implementations
    jest.restoreAllMocks();
    document.querySelectorAll('df-messenger').forEach(el => el.remove());
    document.querySelectorAll('.df-messenger-tooltip').forEach(el => el.remove());
    document.querySelectorAll('link[href*="df-messenger-default.css"]').forEach(el => el.remove());
    document.querySelectorAll('script[src*="df-messenger.js"]').forEach(el => el.remove());
  });

  test('renders nothing in the DOM', () => {
    const { container } = render(<ChatbotWidget />);
    expect(container).toBeEmptyDOMElement();
  });

  test('adds CSS stylesheet if not already present', () => {
    // Mock querySelector to return null (stylesheet not present)
    jest.spyOn(document, 'querySelector').mockImplementation((selector) => 
      selector.includes('df-messenger-default.css') ? null : originalQuerySelector(selector)
    );

    render(<ChatbotWidget />);
    
    expect(document.createElement).toHaveBeenCalledWith('link');
    expect(document.head.appendChild).toHaveBeenCalledWith(
      expect.objectContaining({
        rel: 'stylesheet',
        href: 'https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/themes/df-messenger-default.css'
      })
    );
  });

  test('does not add CSS stylesheet if already present', () => {
    // Mock querySelector to return a stylesheet (already present)
    jest.spyOn(document, 'querySelector').mockImplementation((selector) => 
      selector.includes('df-messenger-default.css') ? {} : originalQuerySelector(selector)
    );

    render(<ChatbotWidget />);
    expect(document.head.appendChild).not.toHaveBeenCalledWith(
      expect.objectContaining({
        rel: 'stylesheet',
        href: 'https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/themes/df-messenger-default.css'
      })
    );
  });

  test('adds script if not already present', () => {
    // Mock querySelector to return null (script not present)
    jest.spyOn(document, 'querySelector').mockImplementation((selector) => 
      selector.includes('df-messenger.js') ? null : originalQuerySelector(selector)
    );

    render(<ChatbotWidget />);
    
    expect(document.createElement).toHaveBeenCalledWith('script');
    expect(document.body.appendChild).toHaveBeenCalledWith(
      expect.objectContaining({
        src: 'https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js',
        async: true
      })
    );
  });

  test('does not add script if already present', () => {
    // Mock querySelector to return a script (already present)
    jest.spyOn(document, 'querySelector').mockImplementation((selector) => 
      selector.includes('df-messenger.js') ? {} : originalQuerySelector(selector)
    );

    render(<ChatbotWidget />);
    expect(document.body.appendChild).not.toHaveBeenCalledWith(
      expect.objectContaining({
        src: 'https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js'
      })
    );
  });

  test('creates df-messenger element when script loads', async () => {
    const mockScript = document.createElement('script');
    const mockOnLoad = jest.fn();
    
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'script') {
        mockScript.onload = mockOnLoad;
        return mockScript;
      }
      return originalCreateElement(tagName);
    });

    render(<ChatbotWidget />);
    
    // Simulate script load
    act(() => {
      if (mockScript.onload) mockScript.onload(new Event('load'));
    });

    expect(document.createElement).toHaveBeenCalledWith('df-messenger');
    expect(document.createElement).toHaveBeenCalledWith('df-messenger-chat-bubble');
    expect(document.createElement).toHaveBeenCalledWith('style');
  });

  test('creates tooltip after delay', async () => {
    jest.useFakeTimers();
    const mockScript = document.createElement('script');
    
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'script') return mockScript;
      return originalCreateElement(tagName);
    });

    render(<ChatbotWidget />);
    
    // Simulate script load
    act(() => {
      if (mockScript.onload) mockScript.onload(new Event('load'));
    });

    // Advance timers to trigger tooltip creation
    act(() => {
      jest.advanceTimersByTime(5000); // 4s delay + some buffer
    });

    expect(document.querySelector('.df-messenger-tooltip')).toBeTruthy();
    jest.useRealTimers();
  });

  test('removes tooltip on close button click', async () => {
    jest.useFakeTimers();
    const mockScript = document.createElement('script');
    
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'script') return mockScript;
      return originalCreateElement(tagName);
    });

    render(<ChatbotWidget />);
    
    // Simulate script load
    act(() => {
      if (mockScript.onload) mockScript.onload(new Event('load'));
    });

    // Advance timers to trigger tooltip creation
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const tooltip = document.querySelector('.df-messenger-tooltip');
    const closeButton = tooltip?.querySelector('.close-tooltip');
    
    act(() => {
      if (closeButton) {
        closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });

    expect(document.querySelector('.df-messenger-tooltip')).toBeNull();
    jest.useRealTimers();
  });

  test('cleans up tooltip on unmount', () => {
    const { unmount } = render(<ChatbotWidget />);
    
    // Add a mock tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'df-messenger-tooltip';
    document.body.appendChild(tooltip);

    unmount();

    expect(document.querySelector('.df-messenger-tooltip')).toBeNull();
  });
});