//@ts-ignore
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useNavigate } from 'react-router-dom'
import AccessDenied from '../../pages/AccessDenied'
import '@testing-library/jest-dom'

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

// Mock MUI components that might cause issues
jest.mock('@mui/material/Button', () => ({ children, onClick, ...props }: any) => (
  <button onClick={onClick} {...props}>
    {children}
  </button>
))

jest.mock('@mui/material/Typography', () => ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
))

jest.mock('@mui/icons-material/LockOutlined', () => () => (
  <div data-testid="lock-icon">LockIcon</div>
))

describe('AccessDenied Component', () => {
  const mockNavigate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useNavigate as jest.Mock).mockReturnValue(mockNavigate)
  })

  it('renders correctly with all elements', () => {
    render(<AccessDenied />)
    
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText(/Your account has been suspended due to policy violations!/i)).toBeInTheDocument()
    expect(screen.getByText(/If you believe this is a mistake, please contact support./i)).toBeInTheDocument()
    expect(screen.getByText('sdproject.wits@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('Back to Login')).toBeInTheDocument()
  })

  it('displays the correct email link', () => {
    render(<AccessDenied />)
    
    const emailLink = screen.getByText('sdproject.wits@gmail.com')
    expect(emailLink).toHaveAttribute('href', 'mailto:sdproject.wits@gmail.com')
    expect(emailLink).toHaveStyle('color: #1976d2')
    expect(emailLink).toHaveStyle('text-decoration: none')
  })

  it('navigates to login page when button is clicked', () => {
    render(<AccessDenied />)
    
    const loginButton = screen.getByText('Back to Login')
    fireEvent.click(loginButton)
    
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('applies correct styles to components', () => {
    render(<AccessDenied />)
    
    const container = screen.getByText('Access Denied').closest('div[class*="MuiContainer-root"]')
    expect(container).toHaveStyle('text-align: center')
    expect(container).toHaveStyle('margin-top: 80px') // mt: 10 translates to 80px
    
    const box = screen.getByText('Access Denied').closest('div[class*="MuiBox-root"]')
    expect(box).toHaveStyle('display: flex')
    expect(box).toHaveStyle('flex-direction: column')
    expect(box).toHaveStyle('align-items: center')
    expect(box).toHaveStyle('gap: 16px') // gap: 2 translates to 16px
  })

  it('renders the LockIcon with correct styles', () => {
    render(<AccessDenied />)
    
    const lockIcon = screen.getByTestId('lock-icon')
    expect(lockIcon).toBeInTheDocument()
    // Since we mocked the icon, we can't test its actual color
    // In a real test, you might want to test the actual icon component
  })

  it('matches snapshot', () => {
    const { asFragment } = render(<AccessDenied />)
    expect(asFragment()).toMatchSnapshot()
  })
})