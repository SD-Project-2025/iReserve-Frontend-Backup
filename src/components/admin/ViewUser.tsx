"use client"

import React from "react";
import {
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Alert,
  Grid,
  CircularProgress,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react"
import {
  ArrowBack as BackIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
} from "@mui/icons-material";

interface User {
  user_id: number;
  name: string;
  email: string;
  type: string;
  status: string;
  created_at: string;
}

const ViewUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<{ id: number; action: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real app, you would fetch from an API endpoint
        // For now, we'll use mock data
        const mockUsers: User[] = [
          {
            user_id: 1,
            name: "John Doe",
            email: "john.doe@example.com",
            type: "resident",
            status: "active",
            created_at: "2023-01-15T00:00:00.000Z",
          },
          {
            user_id: 2,
            name: "Jane Smith",
            email: "jane.smith@example.com",
            type: "staff",
            status: "active",
            created_at: "2023-02-20T00:00:00.000Z",
          },
          {
            user_id: 3,
            name: "Bob Johnson",
            email: "bob.johnson@example.com",
            type: "resident",
            status: "inactive",
            created_at: "2023-03-10T00:00:00.000Z",
          },
        ];

        // Check if user data was passed in location state
        if (location.state?.userData) {
          setUser(location.state.userData);
        } else {
          // Find user in mock data
          const foundUser = mockUsers.find(u => u.user_id.toString() === id);
          if (foundUser) {
            setUser(foundUser);
          } else {
            setError("User not found");
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, location.state]);

  const handleUpdateUserStatus = async (userId: number, status: string) => {
    try {
      setProcessing(true);
      // In a real app, you would call an API endpoint
      // await api.put(`/users/${userId}/status`, { status })

      // For now, we'll update the mock data
      if (user) {
        setUser({ ...user, status });
      }
      setDialogOpen(false);
      setDialogAction(null);
    } catch (err) {
      console.error("Error updating user status:", err);
      setError("Failed to update user status. Please try again later.");
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (id: number, action: string) => {
    setDialogAction({ id, action });
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "resident":
        return "Resident";
      case "staff":
        return "Staff";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!user) {
    return (
      <Alert severity="warning" sx={{ my: 3 }}>
        No user data available
      </Alert>
    );
  }

  return (
    <section>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate("/admin/users")}
        sx={{ mb: 2 }}
        variant="outlined"
      >
        Back to Users
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, mr: 3 }}>
              {user.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1">
                {user.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>User ID:</strong> {user.user_id}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Type:</strong> {getTypeLabel(user.type)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong>{" "}
                <Chip 
                  label={user.status} 
                  color={getStatusColor(user.status)} 
                  size="small" 
                />
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            {user.status === "active" ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<BlockIcon />}
                onClick={() => openDialog(user.user_id, "deactivate")}
                sx={{ mr: 2 }}
              >
                Deactivate User
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<ActivateIcon />}
                onClick={() => openDialog(user.user_id, "activate")}
                sx={{ mr: 2 }}
              >
                Activate User
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {dialogAction?.action === "activate" ? "Activate User" : "Deactivate User"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction?.action === "activate"
              ? "Are you sure you want to activate this user?"
              : "Are you sure you want to deactivate this user?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              dialogAction &&
              handleUpdateUserStatus(
                dialogAction.id, 
                dialogAction.action === "activate" ? "active" : "inactive"
              )
            }
            color={dialogAction?.action === "activate" ? "success" : "error"}
            disabled={processing}
          >
            {dialogAction?.action === "activate" ? "Activate" : "Deactivate"}
            {processing && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
};

export default ViewUser;