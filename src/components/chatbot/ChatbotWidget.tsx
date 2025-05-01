import { useEffect } from 'react';

const ChatbotWidget = () => {
  useEffect(() => {
    // Add CSS stylesheet
    if (!document.querySelector('link[href="https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/themes/df-messenger-default.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/themes/df-messenger-default.css';
      document.head.appendChild(link);
    }

    // Add script
    if (!document.querySelector('script[src="https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js';
      script.async = true;
      document.body.appendChild(script);
      
      // Create Dialogflow elements after script loads
      script.onload = () => {
        // Remove any existing chatbot elements
        document.querySelectorAll('df-messenger').forEach(el => el.remove());
        
        // Create the custom style element
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          df-messenger {
            z-index: 999;
            position: fixed;
            --df-messenger-font-color: #000;
            --df-messenger-font-family: Google Sans;
            --df-messenger-chat-background: #f3f6fc;
            --df-messenger-message-user-background: #d3e3fd;
            --df-messenger-message-bot-background: #fff;
            bottom: 16px;
            right: 16px;
          }
          
          .df-messenger-tooltip {
            position: fixed;
            background: #1976d2; /* Primary blue color */
            color: white; /* White text for contrast */
            border-radius: 8px;
            padding: 12px 15px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            bottom: 80px;
            right: 20px;
            max-width: 240px;
            font-family: 'Google Sans', sans-serif;
            font-size: 14px;
            animation: fadeIn 0.5s;
            z-index: 1000;
            white-space: normal;
            line-height: 1.4;
            font-weight: 400;
            border: 1px solid rgba(255,255,255,0.1);
          }
          
          .df-messenger-tooltip::after {
            content: '';
            position: absolute;
            bottom: -8px;
            right: 20px;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid #1976d2; /* Match background color */
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .close-tooltip {
            cursor: pointer;
            position: absolute;
            top: 5px;
            right: 5px;
            font-size: 16px;
            color: white; /* White X for dark background */
          }
        `;
        document.head.appendChild(styleElement);
        
        // Create the main df-messenger element
        const dfMessenger = document.createElement('df-messenger');
        dfMessenger.setAttribute('project-id', 'ireservechatbot');
        dfMessenger.setAttribute('agent-id', '685fb76a-30f7-4ea0-a93e-414670f66967');
        dfMessenger.setAttribute('language-code', 'en');
        dfMessenger.setAttribute('max-query-length', '-1');
        
        // Create the chat bubble element
        const chatBubble = document.createElement('df-messenger-chat-bubble');
        chatBubble.setAttribute('chat-title', 'iResBot');
        
        // Append the chat bubble to the messenger
        dfMessenger.appendChild(chatBubble);
        
        // Add to the DOM
        document.body.appendChild(dfMessenger);
        
        // Create and show the tooltip with welcome message
        setTimeout(() => {
          // First remove any existing tooltips
          document.querySelectorAll('.df-messenger-tooltip').forEach(el => el.remove());
          
          const tooltip = document.createElement('div');
          tooltip.className = 'df-messenger-tooltip';
          tooltip.innerHTML = '<strong>Hey I am Resie!</strong> A chatbot for iReserve. How can I help you? <span class="close-tooltip">&times;</span>';
          document.body.appendChild(tooltip);
          
          console.log('Tooltip created and added to DOM');
          
          // Add click event to close button
          const closeBtn = tooltip.querySelector('.close-tooltip');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              tooltip.remove();
            });
          }
          
          // Auto close after 8 seconds
          setTimeout(() => {
            if (document.body.contains(tooltip)) {
              tooltip.remove();
            }
          }, 8000);
          
          // Also close tooltip when chat is opened
          setTimeout(() => {
            const chatBubbleElement = document.querySelector('df-messenger-chat-bubble button');
            if (chatBubbleElement) {
              chatBubbleElement.addEventListener('click', () => {
                if (document.body.contains(tooltip)) {
                  tooltip.remove();
                }
              });
            }
          }, 500);
        }, 4000); // Show tooltip after 4 seconds
        
        console.log('New Dialogflow Messenger created successfully');
      };
    }
    
    return () => {
      // Cleanup tooltip when component unmounts
      document.querySelectorAll('.df-messenger-tooltip').forEach(el => el.remove());
    };
  }, []);

  // Component doesn't render anything directly
  return null;
};

export default ChatbotWidget;