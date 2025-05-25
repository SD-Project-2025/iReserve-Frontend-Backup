import React from 'react'
import { render, act, screen, fireEvent } from '@testing-library/react'
import { useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { jwtDecode } from 'jwt-decode'

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}))

jest.mock('../../services/api', () => ({
  api: {
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}))

jest.mock('jwt-decode', () => jest.fn())

// Mock console methods
const mockConsoleLog = jest.fn()
const mockConsoleError = jest.fn()

beforeAll(() => {
  global.console = {
    ...console,
    log: mockConsoleLog,
    error: mockConsoleError,
  }
})

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.location
delete (window as any).location
window.location = { href: '' } as any

describe('AuthContext', () => {
  const mockNavigate = jest.fn()
  const mockJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>
  
  beforeEach(() => {
    process.env.VITE_API_URL = 'http://test-api-url'
    ;(useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    jest.clearAllMocks()
    mockConsoleLog.mockClear()
    mockConsoleError.mockClear()
    localStorageMock.clear()
    // Reset api headers
    api.defaults.headers.common = {}
    // Reset window.location
    window.location.href = ''
  })

  // Test component to consume the context
  const TestComponent = () => {
    const auth = useAuth()
    
    const handleSetAuthData = () => {
      auth.setAuthData('test-token', {
        id: 1,
        type: 'user',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'test.jpg'
      })
    }

    return (
      <div>
        <div data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</div>
        <div data-testid="loading">{auth.loading.toString()}</div>
        {auth.user && <div data-testid="user">{JSON.stringify(auth.user)}</div>}
        <button onClick={auth.login} data-testid="login">Login</button>
        <button onClick={auth.logout} data-testid="logout">Logout</button>
        <button onClick={auth.checkAuth} data-testid="checkAuth">Check Auth</button>
        <button onClick={handleSetAuthData} data-testid="setAuthData">Set Auth Data</button>
      </div>
    )
  }

  it('provides initial context values', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    expect(screen.queryByTestId('user')).not.toBeInTheDocument()
  })

  describe('setAuthData', () => {
    it('sets auth data correctly and logs information', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        fireEvent.click(screen.getByTestId('setAuthData'))
      })

      const expectedUser = {
        id: 1,
        type: 'user',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'test.jpg',
      }

      expect(mockConsoleLog).toHaveBeenCalledWith('Setting Auth Data - token:', 'test-token')
      expect(mockConsoleLog).toHaveBeenCalledWith('Sanitized User Data:', expectedUser)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(expectedUser))
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(expectedUser))
    })

    it('handles localStorage errors gracefully', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Mock localStorage.setItem to throw an error on first call
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage error')
      })

      act(() => {
        fireEvent.click(screen.getByTestId('setAuthData'))
      })

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to store auth data:', expect.any(Error))
    })
  })

  it('handles login correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('login'))
    })

    expect(window.location.href).toBe(
      'http://test-api-url/auth/google?redirect_uri=https%3A%2F%2Fyellow-river-065faef1e.6.azurestaticapps.net%2Fauth%2Fcallback'
    )
  })

  it('handles logout correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('logout'))
    })

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    expect(api.defaults.headers.common['Authorization']).toBeUndefined()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  describe('checkAuth', () => {
    it('handles no token or user in storage', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        fireEvent.click(screen.getByTestId('checkAuth'))
      })

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.queryByTestId('user')).not.toBeInTheDocument()
    })

    it('handles missing token only', () => {
      const testUser = { id: 1, type: 'user' }
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(testUser)
        if (key === 'token') return null
        return null
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        fireEvent.click(screen.getByTestId('checkAuth'))
      })

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    it('handles missing user only', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'test-token'
        if (key === 'user') return null
        return null
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        fireEvent.click(screen.getByTestId('checkAuth'))
      })

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    it('handles expired token', () => {
      const expiredToken = 'expired-token'
      const testUser = { id: 1, type: 'user' }
      
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'token') return expiredToken
        if (key === 'user') return JSON.stringify(testUser)
        return null
      })
      
      mockJwtDecode.mockReturnValue({
        id: 1,
        iat: 1000,
        exp: 1001, // Expired (assuming current time is much later)
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        fireEvent.click(screen.getByTestId('checkAuth'))
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    it('handles valid token', () => {
      const validToken = 'valid-token'
      const testUser = { id: 1, type: 'user', name: 'Test User' }
      
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'token') return validToken
        if (key === 'user') return JSON.stringify(testUser)
        return null
      })
      
      mockJwtDecode.mockReturnValue({
        id: 1,
        iat: 1000,
        exp: Date.now() / 1000 + 3600, // Valid for 1 hour
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        fireEvent.click(screen.getByTestId('checkAuth'))
      })

      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${validToken}`)
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(testUser))
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    it('handles invalid token and logs error', () => {
      const invalidToken = 'invalid-token'
      const testUser = { id: 1, type: 'user' }
      
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'token') return invalidToken
        if (key === 'user') return JSON.stringify(testUser)
        return null
      })
      
      const tokenError = new Error('Invalid token')
      mockJwtDecode.mockImplementation(() => {
        throw tokenError
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        fireEvent.click(screen.getByTestId('checkAuth'))
      })

      expect(mockConsoleError).toHaveBeenCalledWith('Invalid token', tokenError)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    const originalError = console.error
    console.error = jest.fn()
    
    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    )
    
    console.error = originalError
  })

  it('sanitizes user data properly in setAuthData', () => {
    const TestComponentWithExtraData = () => {
      const auth = useAuth()
      
      const handleSetAuthDataWithExtraProps = () => {
        const userWithExtraProps = {
          id: 1,
          type: 'user',
          name: 'Test User',
          email: 'test@example.com',
          picture: 'test.jpg',
          extraProperty: 'should not be saved',
          anotherExtra: { nested: 'object' }
        } as any
        
        auth.setAuthData('test-token', userWithExtraProps)
      }

      return (
        <div>
          <button onClick={handleSetAuthDataWithExtraProps} data-testid="setAuthDataExtra">
            Set Auth Data With Extra
          </button>
          {auth.user && <div data-testid="user">{JSON.stringify(auth.user)}</div>}
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponentWithExtraData />
      </AuthProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('setAuthDataExtra'))
    })

    const expectedSanitizedUser = {
      id: 1,
      type: 'user',
      name: 'Test User',
      email: 'test@example.com',
      picture: 'test.jpg',
    }

    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(expectedSanitizedUser))
    expect(mockConsoleLog).toHaveBeenCalledWith('Sanitized User Data:', expectedSanitizedUser)
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(expectedSanitizedUser))
  })

  // Additional test for complete coverage
  it('provides all context methods', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Verify all methods are available
    expect(screen.getByTestId('login')).toBeInTheDocument()
    expect(screen.getByTestId('logout')).toBeInTheDocument()
    expect(screen.getByTestId('checkAuth')).toBeInTheDocument()
    expect(screen.getByTestId('setAuthData')).toBeInTheDocument()
  })
})