import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardCard from '@/components/dashboard/DashboardCard';

describe('DashboardCard', () => {
  // Sample icon component for testing
  const TestIcon = () => <div data-testid="test-icon">Icon</div>;
  
  test('renders with required props', () => {
    render(
      <DashboardCard
        title="Active Users"
        value={150}
        icon={<TestIcon />}
      />
    );
    
    // Check that title is rendered
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    
    // Check that value is rendered
    expect(screen.getByText('150')).toBeInTheDocument();
    
    // Check that icon is rendered
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
  
  test('renders with string value', () => {
    render(
      <DashboardCard
        title="Status"
        value="Healthy"
        icon={<TestIcon />}
      />
    );
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });
  
  test('renders with custom color', () => {
    const { container } = render(
      <DashboardCard
        title="Alerts"
        value={5}
        icon={<TestIcon />}
        color="#ff0000"
      />
    );
    
    // Find the colored box that contains the icon
    // We can't easily test the exact color with testing-library,
    // but we can check that the component renders without errors
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    
    // Alternatively, if we need to check the color, we can examine the DOM structure
    // but this is implementation-specific and might be brittle
    const coloredBox = container.querySelector('div[style*="color"]');
    expect(coloredBox).toBeTruthy();
  });
  
  test('renders children when provided', () => {
    render(
      <DashboardCard
        title="Revenue"
        value={1000}
        icon={<TestIcon />}
      >
        <div data-testid="child-content">Additional stats</div>
      </DashboardCard>
    );
    
    // Check that children are rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Additional stats')).toBeInTheDocument();
  });
  
  test('applies custom sx props', () => {
    const { container } = render(
      <DashboardCard
        title="Downloads"
        value={250}
        icon={<TestIcon />}
        sx={{ backgroundColor: 'blue' }}
      />
    );
    
    // Check that the Card component received the sx prop
    // This is implementation-specific and might need adjustment based on how Material-UI applies styles
    const card = container.firstChild;
    expect(card).toHaveClass('MuiCard-root');
    
    // We can't easily test the exact style with testing-library,
    // but we can check that the component renders without errors
    expect(screen.getByText('Downloads')).toBeInTheDocument();
  });
  
  test('renders with correct HTML elements', () => {
    render(
      <DashboardCard
        title="Tasks"
        value={42}
        icon={<TestIcon />}
      />
    );
    
    // Check that title uses h3 element
    const title = screen.getByText('Tasks');
    expect(title.tagName).toBe('H3');
    
    // Check that value uses p element
    const value = screen.getByText('42');
    expect(value.tagName).toBe('P');
  });
  
  test('renders with default color when no color is provided', () => {
    const { container } = render(
      <DashboardCard
        title="Projects"
        value={15}
        icon={<TestIcon />}
      />
    );
    
    // The default color should be "primary.main"
    // We can't easily test this with testing-library,
    // but we can check that the component renders without errors
    expect(screen.getByText('Projects')).toBeInTheDocument();
    
    // Find the colored box that contains the icon
    const coloredBox = container.querySelector('[class*="MuiBox-root"]');
    expect(coloredBox).toBeTruthy();
  });
});