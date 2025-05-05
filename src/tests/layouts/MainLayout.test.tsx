import { render, screen, fireEvent } from '@testing-library/react'
import MainLayout from './MainLayout' // Adjust path accordingly
import { MemoryRouter } from 'react-router-dom'

// Mock custom hooks
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      picture: '',
      type: 'staff',
    },
    logout: jest.fn(),
  }),
}))

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    mode: 'light',
    toggleTheme: jest.fn(),
  }),
}))

describe('MainLayout Component', () => {
  const renderLayout = () =>
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    )

  it('renders AppBar with logo and title', () => {
    renderLayout()
    expect(screen.getByText('iReserve')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toBeInTheDocument()
  })

  it('displays user info when logged in', () => {
    renderLayout()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Staff Account')).toBeInTheDocument()
  })

  it('toggles dark mode when theme button is clicked', () => {
    const toggleThemeMock = jest.fn()
    jest.spyOn(require('@/contexts/ThemeContext'), 'useTheme').mockReturnValue({
      mode: 'light',
      toggleTheme: toggleThemeMock,
    })

    renderLayout()
    const themeButton = screen.getByLabelText('Switch to dark mode')
    fireEvent.click(themeButton)
    expect(toggleThemeMock).toHaveBeenCalled()
  })

  it('shows admin menu items if user is staff', () => {
    renderLayout()
    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('Manage Facilities')).toBeInTheDocument()
    expect(screen.getByText('Manage Users')).toBeInTheDocument()
  })

  it('does not show admin menu items if user is not staff', () => {
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
        picture: '',
        type: 'regular',
      },
      logout: jest.fn(),
    })

    renderLayout()
    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
    expect(screen.queryByText('Manage Facilities')).not.toBeInTheDocument()
  })

  it('opens and closes drawer on mobile', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 960px)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))

    renderLayout()

    const menuButton = screen.getByRole('button', { name: /open drawer/i })
    fireEvent.click(menuButton)

    expect(screen.getByRole('navigation')).toBeInTheDocument()

    fireEvent.click(menuButton) // Close again
    // Add assertions if needed depending on how Drawer is rendered
  })

  it('navigates to dashboard when logo is clicked', () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    renderLayout()
    fireEvent.click(screen.getByText('iReserve'))
    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('opens profile menu and shows logout option', () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    renderLayout()

    const avatarButton = screen.getByRole('button', { name: /profile/i })
    fireEvent.click(avatarButton)

    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Logout'))
    expect(navigateMock).toHaveBeenCalledWith('/login')
  })
})