
import { render, act, screen } from '@testing-library/react'
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

describe('AuthContext', () => {
  const mockNavigate = jest.fn()
  const mockJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>
  
  beforeEach(() => {
    process.env.VITE_API_URL = 'http://test-api-url'
    ;(useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  // Test component to consume the context
  const TestComponent = () => {
    const auth = useAuth()
    return (
      <div>
        <div data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</div>
        <div data-testid="loading">{auth.loading.toString()}</div>
        {auth.user && <div data-testid="user">{JSON.stringify(auth.user)}</div>}
        <button onClick={auth.login}>Login</button>
        <button onClick={auth.logout}>Logout</button>
        <button onClick={auth.checkAuth}>Check Auth</button>
      </div>
    )
  }

  it('provides initial context values', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(getByTestId('isAuthenticated').textContent).toBe('false')
    expect(getByTestId('loading').textContent).toBe('true')
    expect(screen.queryByTestId('user')).not.toBeInTheDocument()
  })

  it('sets auth data correctly', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const testToken = 'test-token'
    const testUser = {
      id: 1,
      type: 'user',
      name: 'Test User',
      email: 'test@example.com',
      picture: 'test.jpg',
    }

    act(() => {
      const auth = useAuth()
      auth.setAuthData(testToken, testUser)
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', testToken)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(testUser))
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${testToken}`)
    expect(getByTestId('isAuthenticated').textContent).toBe('true')
    expect(getByTestId('loading').textContent).toBe('false')
    expect(getByTestId('user').textContent).toBe(JSON.stringify(testUser))
  })

  it('handles login correctly', () => {
    window.location = { href: '' } as any

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    act(() => {
      const auth = useAuth()
      auth.login()
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
      const auth = useAuth()
      auth.logout()
    })

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    expect(api.defaults.headers.common['Authorization']).toBeUndefined()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  describe('checkAuth', () => {
    it('handles no token or user in storage', () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        const auth = useAuth()
        auth.checkAuth()
      })

      expect(getByTestId('isAuthenticated').textContent).toBe('false')
      expect(getByTestId('loading').textContent).toBe('false')
    })

    it('handles expired token', () => {
      const expiredToken = 'expired-token'
      const testUser = { id: 1, type: 'user' }
      
      localStorageMock.setItem('token', expiredToken)
      localStorageMock.setItem('user', JSON.stringify(testUser))
      
      mockJwtDecode.mockReturnValue({
        id: 1,
        iat: 1000,
        exp: 1001, // Expired
      })

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        const auth = useAuth()
        auth.checkAuth()
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(getByTestId('isAuthenticated').textContent).toBe('false')
    })

    it('handles valid token', () => {
      const validToken = 'valid-token'
      const testUser = { id: 1, type: 'user' }
      
      localStorageMock.setItem('token', validToken)
      localStorageMock.setItem('user', JSON.stringify(testUser))
      
      mockJwtDecode.mockReturnValue({
        id: 1,
        iat: 1000,
        exp: Date.now() / 1000 + 3600, // Valid for 1 hour
      })

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        const auth = useAuth()
        auth.checkAuth()
      })

      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${validToken}`)
      expect(getByTestId('isAuthenticated').textContent).toBe('true')
      expect(getByTestId('user').textContent).toBe(JSON.stringify(testUser))
    })

    it('handles invalid token', () => {
      const invalidToken = 'invalid-token'
      const testUser = { id: 1, type: 'user' }
      
      localStorageMock.setItem('token', invalidToken)
      localStorageMock.setItem('user', JSON.stringify(testUser))
      
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        const auth = useAuth()
        auth.checkAuth()
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(getByTestId('isAuthenticated').textContent).toBe('false')
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
})