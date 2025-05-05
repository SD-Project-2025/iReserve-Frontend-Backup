import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecentActivityList from './RecentActivityList';
import '@testing-library/jest-dom';

// Mock MUI components that might cause issues in tests
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  CircularProgress: () => <div>CircularProgress</div>,
}));

describe('RecentActivityList Component', () => {
  const mockActivities: Activity[] = [
    {
      id: 1,
      title: 'Activity 1',
      subtitle: 'Subtitle 1',
      date: '2023-01-01',
      status: 'Pending',
      statusColor: 'warning',
      rawData: {}
    },
    {
      id: 2,
      title: 'Activity 2',
      date: '2023-01-02',
      status: 'Completed',
      statusColor: 'success',
      rawData: {}
    }
  ];

  test('renders loading state', () => {
    render(
      <RecentActivityList 
        title="Recent Activities" 
        activities={[]} 
        emptyMessage="No activities" 
        loading={true} 
      />
    );

    expect(screen.getByText('CircularProgress')).toBeInTheDocument();
  });

  test('renders empty state', () => {
    render(
      <RecentActivityList 
        title="Recent Activities" 
        activities={[]} 
        emptyMessage="No activities found" 
        loading={false} 
      />
    );

    expect(screen.getByText('No activities found')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('renders activities list', () => {
    render(
      <RecentActivityList 
        title="Recent Activities" 
        activities={mockActivities} 
        emptyMessage="No activities" 
        loading={false} 
      />
    );

    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Subtitle 1')).toBeInTheDocument();
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
    expect(screen.getByText('2023-01-02')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  test('renders title correctly', () => {
    render(
      <RecentActivityList 
        title="Custom Title" 
        activities={mockActivities} 
        emptyMessage="No activities" 
        loading={false} 
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  test('renders View All button with link', () => {
    render(
      <MemoryRouter>
        <RecentActivityList 
          title="Recent Activities" 
          activities={mockActivities} 
          emptyMessage="No activities" 
          loading={false}
          viewAllLink="/all-activities" 
        />
      </MemoryRouter>
    );

    const viewAllButton = screen.getByText('View All');
    expect(viewAllButton).toBeInTheDocument();
    expect(viewAllButton.closest('a')).toHaveAttribute('href', '/all-activities');
  });

  test('renders View All button with action', () => {
    const mockAction = jest.fn();
    
    render(
      <RecentActivityList 
        title="Recent Activities" 
        activities={mockActivities} 
        emptyMessage="No activities" 
        loading={false}
        viewAllAction={mockAction} 
      />
    );

    const viewAllButton = screen.getByText('View All');
    fireEvent.click(viewAllButton);
    expect(mockAction).toHaveBeenCalled();
  });

  test('renders custom actions for each activity', () => {
    const mockRenderActions = (activity: Activity) => (
      <Button size="small" data-testid={`action-${activity.id}`}>
        Action
      </Button>
    );
    
    render(
      <RecentActivityList 
        title="Recent Activities" 
        activities={mockActivities} 
        emptyMessage="No activities" 
        loading={false}
        renderActions={mockRenderActions} 
      />
    );

    expect(screen.getByTestId('action-1')).toBeInTheDocument();
    expect(screen.getByTestId('action-2')).toBeInTheDocument();
  });

  test('renders dividers between activities', () => {
    render(
      <RecentActivityList 
        title="Recent Activities" 
        activities={mockActivities} 
        emptyMessage="No activities" 
        loading={false} 
      />
    );

    const dividers = screen.getAllByRole('separator');
    expect(dividers.length).toBe(mockActivities.length - 1);
  });

  test('does not render View All button when no link or action provided', () => {
    render(
      <RecentActivityList 
        title="Recent Activities" 
        activities={mockActivities} 
        emptyMessage="No activities" 
        loading={false} 
      />
    );

    expect(screen.queryByText('View All')).not.toBeInTheDocument();
  });
});