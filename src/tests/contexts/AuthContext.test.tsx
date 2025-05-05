import { render, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { MemoryRouter } from 'react-router-dom'
import jwtDecode from 'jwt-decode'

// Mock jwtDecode
jest.mock('jwt-decode')

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value
    },
    removeItem: (key: string): void => {
      delete store[key]
    },
    clear: (): void => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock api defaults
jest.mock('@/services/api', () => ({
  api: {
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}))

// Mock window.location
delete window.location
window.location = {
  href: '',
  assign: jest.fn(),
} as any

describe('AuthProvider and useAuth', () => {
  const TestComponent = () => {
    const { isAuthenticated, user, loading, login, logout, checkAuth, setAuthData } = useAuth()
    
    return (
      <div>
        <span data-testid="auth-status">{isAuthenticated ? 'Logged In' : 'Logged Out'}</span>
        <span data-testid="user">{user ? JSON.stringify(user) : 'No User'}</span>
        <span data-testid="loading">{loading ? 'Loading...' : 'Ready'}</span>
        <button onClick={checkAuth}>Check Auth</button>
        <button onClick={login}>Login</button>
        <button onClick={logout}>Logout</button>
        <button onClick={() => setAuthData('fake-token', { id: 1, type: 'admin', name: 'John Doe' })}>
          Set Auth Data
        </button>
      </div>
    )
  }

  const renderWithContext = () => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    mockLocalStorage.clear()
    ;(window.location.assign as jest.Mock).mockClear()
  })

  it('initializes with loading state', async () => {
    const { getByTestId } = renderWithContext()
    expect(getByTestId('loading')).toHaveTextContent('Loading...')
  })

  it('sets auth data and persists to localStorage', async () => {
    const { getByTestId, getByText } = renderWithContext()
    fireEvent.click(getByText('Set Auth Data'))

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('Logged In')
      expect(getByTestId('user')).toHaveTextContent('John Doe')
      expect(localStorage.getItem('token')).toBe('fake-token')
      expect(localStorage.getItem('user')).toContain('John Doe')
    })
  })

  it('redirects to Google login on login()', async () => {
    const { getByText } = renderWithContext()
    fireEvent.click(getByText('Login'))

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/auth/google?redirect_uri=')
      )
    })
  })

  it('logs out and clears auth data', async () => {
    const { getByTestId, getByText } = renderWithContext()
    fireEvent.click(getByText('Set Auth Data'))
    fireEvent.click(getByText('Logout'))

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('Logged Out')
      expect(getByTestId('user')).toHaveTextContent('No User')
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  it('checks auth and keeps user if token is valid', async () => {
    // Mock localStorage
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('user', JSON.stringify({ id: 2, type: 'user', name: 'Jane Doe' }))

    // Mock decoded JWT with future exp
    ;(jwtDecode as jest.Mock).mockReturnValue({
      id: 2,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour later
    })

    const { getByTestId, getByText } = renderWithContext()
    fireEvent.click(getByText('Check Auth'))

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('Logged In')
      expect(getByTestId('user')).toHaveTextContent('Jane Doe')
    })
  })

  it('logs out if token is expired', async () => {
    localStorage.setItem('token', 'expired-token')
    localStorage.setItem('user', JSON.stringify({ id: 3, type: 'staff', name: 'Alice' }))

    // Mock decoded JWT with past exp
    ;(jwtDecode as jest.Mock).mockReturnValue({
      id: 3,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    })

    const { getByTestId, getByText } = renderWithContext()
    fireEvent.click(getByText('Check Auth'))

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('Logged Out')
      expect(getByTestId('user')).toHaveTextContent('No User')
    })
  })

  it('handles invalid token gracefully', async () => {
    localStorage.setItem('token', 'invalid-token')
    localStorage.setItem('user', JSON.stringify({ id: 4, type: 'admin' }))

    ;(jwtDecode as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid token')
    })

    const { getByTestId, getByText } = renderWithContext()
    fireEvent.click(getByText('Check Auth'))

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('Logged Out')
      expect(getByTestId('user')).toHaveTextContent('No User')
    })
  })
})