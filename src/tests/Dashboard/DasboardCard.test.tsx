import { render, screen } from '@testing-library/react'
import DashboardCard from '@/components/dashboard/DashboardCard'

describe('DashboardCard Component', () => {
  const defaultProps = {
    title: 'Sales',
    value: 12345,
    icon: <span data-testid="icon">Icon</span>,
  }

  it('renders title and value correctly', () => {
    render(<DashboardCard {...defaultProps} />)
    
    expect(screen.getByText('Sales')).toBeInTheDocument()
    expect(screen.getByText('12345')).toBeInTheDocument()
  })

  it('renders the provided icon', () => {
    render(<DashboardCard {...defaultProps} />)
    
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('applies default color "primary.main" to icon container', () => {
    render(<DashboardCard {...defaultProps} />)
    
    const iconContainer = screen.getByTestId('icon').parentElement
    expect(iconContainer).toHaveStyle('color: primary.main')
    expect(iconContainer).toHaveStyle('background-color: primary.main15')
  })

  it('allows custom color prop', () => {
    const customColor = 'secondary.dark'
    render(<DashboardCard {...defaultProps} color={customColor} />)
    
    const iconContainer = screen.getByTestId('icon').parentElement
    expect(iconContainer).toHaveStyle(`color: ${customColor}`)
    expect(iconContainer).toHaveStyle(`background-color: ${customColor}15`)
  })

  it('passes additional sx styles to Card', () => {
    const customSx = { maxWidth: 400 }
    render(<DashboardCard {...defaultProps} sx={customSx} />)
    
    const card = screen.getByTestId('card')
    expect(card).toHaveStyle('max-width: 400px')
  })

  it('renders children when provided', () => {
    const childContent = <div data-testid="child">Extra Info</div>
    render(<DashboardCard {...defaultProps}>{childContent}</DashboardCard>)
    
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders number value as string', () => {
    render(<DashboardCard {...defaultProps} value={987} />)
    
    expect(screen.getByText('987')).toBeInTheDocument()
  })

  it('renders string value correctly', () => {
    render(<DashboardCard {...defaultProps} value="Active" />)
    
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})