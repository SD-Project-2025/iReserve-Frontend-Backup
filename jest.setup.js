// Mock the import.meta object
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_CHATBOT_AGENT_ID: 'test-agent-id',
        VITE_CHATBOT_PROJECT_ID: 'test-project-id',
      }
    }
  },
  writable: true
});