import { setTestUserType, resetDevSettings } from '../../utils/devUtils';

// Mock environment variables in Jest
const originalEnv = process.env;

beforeAll(() => {
  jest.resetModules(); // Reset modules before each test
  process.env = {
    ...originalEnv,
    DEV: 'true', // Default to dev mode unless overridden
  };
});

afterAll(() => {
  process.env = originalEnv; // Restore original env after all tests
});

// Mock localStorage
type MockLocalStorage = {
  store: Record<string, string>;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const mockLocalStorage: MockLocalStorage = {
  store: {},
  getItem: jest.fn(function (this: MockLocalStorage, key: string) {
    return this.store[key] || null;
  }),
  setItem: jest.fn(function (this: MockLocalStorage, key: string, value: string) {
    this.store[key] = value;
  }),
  removeItem: jest.fn(function (this: MockLocalStorage, key: string) {
    delete this.store[key];
  }),
  clear: jest.fn(function (this: MockLocalStorage) {
    this.store = {};
  }),
};

// Mock window.location.reload
const mockReload = jest.fn();

beforeEach(() => {
  // Set up global localStorage and location
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(window, 'location', {
    value: {
      reload: mockReload,
    },
    configurable: true,
    writable: true,
  });

  jest.clearAllMocks();
  mockLocalStorage.clear();
});

describe('setTestUserType', () => {
  it('should set resident user type correctly in dev', () => {
    setTestUserType('resident');

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ type: 'resident' })
    );
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testAdminDashboard');
    expect(mockReload).toHaveBeenCalled();
  });

  it('should set admin privileges correctly', () => {
    setTestUserType('admin');

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ type: 'staff' })
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'testAdminDashboard',
      'true'
    );
    expect(mockReload).toHaveBeenCalled();
  });

  it('should preserve existing user properties', () => {
    const existingUser = { id: 123, name: 'Test User', type: 'old' };
    mockLocalStorage.store.user = JSON.stringify(existingUser);

    setTestUserType('staff');

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ ...existingUser, type: 'staff' })
    );
  });

  it('should warn and do nothing in production', () => {
    // Temporarily override environment to simulate production
    process.env.DEV = 'false';
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    setTestUserType('admin');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'This function is only available in development mode'
    );
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

    // Clean up
    consoleWarnSpy.mockRestore();
  });
});

describe('resetDevSettings', () => {
  it('should clear testAdminDashboard', () => {
    mockLocalStorage.store.testAdminDashboard = 'true';
    resetDevSettings();

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testAdminDashboard');
  });

  it('should not affect other localStorage items', () => {
    mockLocalStorage.store.otherSetting = 'value';
    resetDevSettings();

    expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(1);
    expect(mockLocalStorage.store.otherSetting).toBe('value');
  });

  it('should warn and do nothing in production', () => {
    process.env.DEV = 'false';
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    resetDevSettings();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'This function is only available in development mode'
    );
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();

    // Clean up
    consoleWarnSpy.mockRestore();
  });
});