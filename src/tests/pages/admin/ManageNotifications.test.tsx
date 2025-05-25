// Add to the top of ManageNotifications.test.tsx
jest.mock('@/services/emailservice', () => ({
  emailservice: {
    post: jest.fn(),
  },
  
}));import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageNotifications from '@/pages/admin/ManageNotifiations';
import { emailservice } from '@/services/emailservice';
import '@testing-library/jest-dom';

jest.mock('@/services/emailservice');

describe('ManageNotifications', () => {
  const mockPost = emailservice.post as jest.Mock;

  beforeEach(() => {
    mockPost.mockReset();
  });

  it('renders all form elements', () => {
    render(<ManageNotifications />);
    
    expect(screen.getByLabelText('Recipient Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByText('Send Notification')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ManageNotifications />);
    
    fireEvent.click(screen.getByText('Send Notification'));
    
    await waitFor(() => {
      expect(screen.getByText('Subject and message are required')).toBeInTheDocument();
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  it('handles successful submission', async () => {
    mockPost.mockResolvedValue({
      data: { status: 'success', message: 'Notifications sent' }
    });

    render(<ManageNotifications />);
    
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test Message' } });
    fireEvent.click(screen.getByText('Send Notification'));
    
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/emails/broadcast', {
        recipient_type: 'ALL',
        subject: 'Test Subject',
        message: 'Test Message'
      });
      expect(screen.getByText('Notifications sent')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toHaveValue('');
      expect(screen.getByLabelText('Message')).toHaveValue('');
    });
  });

  it('handles API errors', async () => {
    const errorResponse = {
      response: {
        status: 500,
        data: { message: 'Server error' }
      }
    };
    mockPost.mockRejectedValue(errorResponse);

    render(<ManageNotifications />);
    
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Send Notification'));
    
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    mockPost.mockRejectedValue({ request: {} });

    render(<ManageNotifications />);
    
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Send Notification'));
    
    await waitFor(() => {
      expect(screen.getByText('No response from server')).toBeInTheDocument();
    });
  });

  it('resets form on cancel', async () => {
    render(<ManageNotifications />);
    
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.getByLabelText('Subject')).toHaveValue('');
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('updates recipient type', async () => {
    render(<ManageNotifications />);
    
    fireEvent.mouseDown(screen.getByLabelText('Recipient Type'));
    fireEvent.click(screen.getByText('Staff Only'));
    
    expect(screen.getByText('Staff Only')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    mockPost.mockImplementation(() => new Promise(() => {}));

    render(<ManageNotifications />);
    
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Send Notification'));
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Send Notification')).toBeDisabled();
  });

  it('disables send button when fields are empty', () => {
    render(<ManageNotifications />);
    
    const sendButton = screen.getByText('Send Notification');
    expect(sendButton).toBeDisabled();
    
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test' } });
    
    expect(sendButton).not.toBeDisabled();
  });
});