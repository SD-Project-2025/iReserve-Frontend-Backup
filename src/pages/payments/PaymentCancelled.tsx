import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/events/${id}`);
    }, 10000);

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate, id]);

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <CancelIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Payment Cancelled ⚠️
      </Typography>

      <CircularProgress sx={{ display: 'block', mx: 'auto', mb: 2 }} />
      
      <Typography variant="body1">
        Redirecting to event page in {countdown} seconds...
      </Typography>

      <Button 
        variant="outlined" 
        color="error"
        sx={{ mt: 3 }}
        onClick={() => navigate(`/events/${id}`)}
      >
        Return to Event Now
      </Button>
    </Box>
  );
};

export default PaymentCancelled;