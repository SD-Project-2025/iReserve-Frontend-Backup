//@ts-ignore
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useNavigate } from 'react-router-dom'
import NotFoundPage from '../../pages/NotFoundPage'

import '@testing-library/jest-dom'

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

describe('NotFoundPage Component', () => {
  const mockNavigate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useNavigate as jest.Mock).mockReturnValue(mockNavigate)
  })

  it('renders correctly with all elements', () => {
    render(<NotFoundPage />)
    
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    expect(screen.getByText(/The page you are looking for doesn't exist or has been moved./i)).toBeInTheDocument()
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
  })

  it('navigates to dashboard when button is clicked', () => {
    render(<NotFoundPage />)
    
    const dashboardButton = screen.getByText('Go to Dashboard')
    fireEvent.click(dashboardButton)
    
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('applies correct styles to the container', () => {
    render(<NotFoundPage />)
    
    const container = screen.getByText('404').parentElement
    expect(container).toHaveStyle('display: flex')
    expect(container).toHaveStyle('flex-direction: column')
    expect(container).toHaveStyle('align-items: center')
    expect(container).toHaveStyle('justify-content: center')
    expect(container).toHaveStyle('min-height: calc(100vh - 200px)')
    expect(container).toHaveStyle('text-align: center')
    expect(container).toHaveStyle('padding: 24px') // p: 3 translates to 24px
  })

  it('applies correct styles to the button', () => {
    render(<NotFoundPage />)
    
    const button = screen.getByText('Go to Dashboard')
    expect(button).toHaveStyle('margin-top: 16px') // mt: 2 translates to 16px
  })

  it('has proper heading hierarchy', () => {
    render(<NotFoundPage />)
    
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('404')
    
    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2).toHaveTextContent('Page Not Found')
  })

  it('matches snapshot', () => {
    const { asFragment } = render(<NotFoundPage />)
    expect(asFragment()).toMatchSnapshot()
  })
})