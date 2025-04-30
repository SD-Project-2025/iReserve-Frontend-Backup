import { useEffect } from 'react';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
  useEffect(() => {
    // Check if script already exists to prevent duplicates
    if (!document.querySelector('script[src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1';
      script.async = true;
      document.body.appendChild(script);
      
      // Make sure to create the df-messenger element only after script loads
      script.onload = () => {
        // Remove existing df-messenger elements to prevent duplicates
        const existingMessenger = document.querySelector('df-messenger');
        if (existingMessenger) {
          existingMessenger.remove();
        }
        
        // Create the df-messenger element
        const dfMessenger = document.createElement('df-messenger');
        dfMessenger.setAttribute('intent', 'WELCOME');
        dfMessenger.setAttribute('chat-title', 'iReserveSd');
        dfMessenger.setAttribute('agent-id', 'e1477c61-bd55-453a-959d-c9cdf57f9a90');
        dfMessenger.setAttribute('language-code', 'en');
        
        // Add to DOM
        document.body.appendChild(dfMessenger);
        
        // Register a custom event listener to know when the component is fully defined
        dfMessenger.addEventListener('df-messenger-loaded', () => {
          console.log('Dialogflow Messenger loaded successfully');
        });
      };
    }
    
    return () => {
      // Don't remove script on unmount as it may cause issues with reloading
      // Just remove the messenger element if needed
      // document.querySelector('df-messenger')?.remove();
    };
  }, []);

  // Component doesn't render anything directly
  return null;
};

export default ChatbotWidget;