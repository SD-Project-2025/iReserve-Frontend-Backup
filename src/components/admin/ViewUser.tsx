"use client"

import React from "react"
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
} from "@mui/material"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  ArrowBack as BackIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  
  PersonAdd as PersonAddIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material"
import { api } from "@/services/api" // Adjust path if needed
import { Label } from "recharts"

interface User {
  user_id: number
  name: string
  email: string
  type: string
  status: string
  created_at: string
  is_admin?: boolean
}
interface Staff {
  staff_id: number
  user_id: number
  employee_id: string
  position: string
  department: string
  is_admin: boolean
}
interface Resident {
  resident_id: number
  user_id: number
  encrypted_address: string
  membership_type: "basic" | "premium" | "vip"
  membership_start_date: string
  membership_end_date: string
}

const ViewUser: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()  
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  const [staff, setStaff] = useState<Staff | null>(null)
  const [resident, setResident] = useState<Resident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userType = location.state?.userType || user?.type || "unknown"
  const userData = location.state?.userData
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false)

  const [dialogAction, setDialogAction] = useState<{ id: number; action: string } | null>(null)
  const [dialogAdminAction, setDialogAdminAction] = useState<{ id: number; is_admin: boolean } | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)

        if (location.state?.userData) {
          setUser(location.state.userData)
          return
        }

        const response = await api.get(`/manage/users`)
        const foundUser = response.data.data.find((u: User) => u.user_id.toString() === id)

        if (foundUser) {
          setUser(foundUser)
        } else {
          setError("User not found")
        }
      } catch (err: any) {
        console.error("Error fetching user:", err)
        setError(
          err.response?.data?.message || "Failed to load user. Please try again later."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id, location.state])
useEffect(() => {
  switch (userType) {
    case "staff":
      setStaff(userData)
      break
    case "resident":
      setResident(userData)
      break
    default:
      setStaff(null)
      setResident(null)
  }
}, [userType, userData])

  // Handle user status update
  const handleUpdateUserStatus = async () => {
    if (!dialogAction || !user) return
    try {
      setProcessing(true)
      const newStatus = dialogAction.action === "activate" ? "active" : "inactive"
      const res = await api.put(`/manage/users/${dialogAction.id}/status`, { status: newStatus })

      if (res.data?.success) {
        setUser({ ...user, status: newStatus })
        setError(null)
      }
    } catch (err: any) {
      console.error("Error updating user status:", err)
      setError(
        err.response?.data?.message || "Failed to update user status. Please try again later."
      )
    } finally {
      setProcessing(false)
      setDialogOpen(false)
      setDialogAction(null)
    }
  }

  // Handle admin role toggle
  const handleToggleAdmin = async () => {
    if (!dialogAdminAction || !user) return
    try {
      setProcessing(true)
      const res = await api.put(`/manage/users/${dialogAdminAction.id}/admin`, {
        is_admin: dialogAdminAction.is_admin,
      })

      if (res.data?.success) {
        setUser({ ...user, is_admin: dialogAdminAction.is_admin })
        setError(null)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to update admin privileges. Please try again later."
      )
    } finally {
      setProcessing(false)
      setAdminDialogOpen(false)
      setDialogAdminAction(null)
    }
  }

  // Handle upgrade to staff
  const handleUpgradeToStaff = async () => {
    if (!user) return
    try {
      setProcessing(true)
      // Get the employee_id value from the input field
      const code = "EMP"
      const employeeIdInput = document.querySelector<HTMLInputElement>('input[name="employee_id"]')
      const employee_id = employeeIdInput ? code + employeeIdInput.value : ""

      if (!employee_id) {
        setError("Employee ID is required.")
        setProcessing(false)
        return
      }

      const res = await api.post(`/manage/users/${user?.user_id}/upgrade`, {
        employee_id,
      })

      if (res.data?.success) {
        setUser({ ...user, type: "staff" })
        setError(null)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to upgrade user to staff. Please try again later."
      )
    } finally {
      setProcessing(false)
      setUpgradeDialogOpen(false)
    }
  }

  // Handle downgrade to resident
  const handleDowngradeToResident = async () => {
    if (!user) return
    try {
      setProcessing(true)
      const res = await api.post(`/manage/users/${user?.user_id}/downgrade`)

      if (res.data?.success) {
        setUser({ ...user, type: "resident", is_admin: false })
        setError(null)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to downgrade user to resident. Please try again later."
      )
    } finally {
      setProcessing(false)
      setDowngradeDialogOpen(false)
    }
  }

  const openDialog = (id: number, action: string) => {
    setDialogAction({ id, action })
    setDialogOpen(true)
  }

  const openAdminDialog = (id: number, makeAdmin: boolean) => {
    setDialogAdminAction({ id, is_admin: makeAdmin })
    setAdminDialogOpen(true)
  }

  const openUpgradeDialog = () => {
    setUpgradeDialogOpen(true)
  }

  const openDowngradeDialog = () => {
    setDowngradeDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success"
      case "inactive":
        return "error"
      default:
        return "default"
    }
  }

   

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 3 }}>
        {error}
      </Alert>
    )
  }

  if (!user) {
    return (
      <Alert severity="warning" sx={{ my: 3 }}>
        No user data available
      </Alert>
    )
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
              <strong>Type:</strong> {userType}
              </Typography>
              {/* Staff-specific info */}
              {userType === "staff" && staff && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                <strong>Employee ID:</strong> {staff.employee_id}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                <strong>Position:</strong> {staff.position}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                <strong>Department:</strong> {staff.department}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                <strong>Admin:</strong> {staff.is_admin ? "Yes" : "No"}
                </Typography>
              </>
              )}
              {/* Resident-specific info */}
              {userType === "resident" && resident && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                <strong>Membership Type:</strong> {resident.membership_type}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                <strong>Membership Start:</strong> {new Date(resident.membership_start_date).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                <strong>Membership End:</strong> {new Date(resident.membership_end_date).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                <strong>Address:</strong> {resident.encrypted_address}
                </Typography>
              </>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
              <strong>Status:</strong>{" "}
              <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
              <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}
              </Typography>
            </Grid>
            </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
            {/* Toggle Admin Role */}
            <Button
              variant="contained"
              color={user.is_admin ? "error" : "success"}
              startIcon={<AdminIcon />}
              onClick={() => openAdminDialog(user.user_id, !user.is_admin)}
            >
              {user.is_admin ? "Revoke Admin" : "Make Admin"}
            </Button>

            {/* Upgrade/Downgrade Button */}
            {userType === "resident" ? (
              <Button
              variant="contained"
              color="info"
              startIcon={<WorkIcon />}
              onClick={openUpgradeDialog}
              >
              Upgrade to Staff
              </Button>
            ) : (
              <Button
              variant="contained"
              color="warning"
              startIcon={<PersonAddIcon />}
              onClick={openDowngradeDialog}
              >
              Downgrade to Resident
              </Button>
            )}

            {/* Activate/Deactivate Button */}
            {user.status === "active" ? (
              <Button
              variant="contained"
              color="error"
              startIcon={<BlockIcon />}
              onClick={() => openDialog(user.user_id, "deactivate")}
              sx={{ whiteSpace: "nowrap" }}
              >
              Deactivate User
              </Button>
            ) : (
              <Button
              variant="contained"
              color="success"
              startIcon={<ActivateIcon />}
              onClick={() => openDialog(user.user_id, "activate")}
              sx={{ whiteSpace: "nowrap" }}
              >
              Activate User
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
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
        onClick={handleUpdateUserStatus}
        color={dialogAction?.action === "activate" ? "success" : "error"}
        disabled={processing}
          >
        {dialogAction?.action === "activate" ? "Activate" : "Deactivate"}
        {processing && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Toggle Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)}>
        <DialogTitle>
          {dialogAdminAction?.is_admin ? "Grant Admin Privileges" : "Revoke Admin Privileges"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAdminAction?.is_admin
              ? "Are you sure you want to make this user an admin?"
              : "Are you sure you want to revoke admin access?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleToggleAdmin}
            color={dialogAdminAction?.is_admin ? "success" : "error"}
            disabled={processing}
          >
            Confirm
            {processing && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade to Staff Dialog */}
      <Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)}>
        <DialogTitle>Upgrade to Staff</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Label>Employee ID</Label>
            <input
              type="text"
              name="employee_id"
              placeholder="Enter Employee ID"
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </Box>
          <DialogContentText>
            Are you sure you want to upgrade this user to a staff member?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleUpgradeToStaff} color="info" disabled={processing}>
            Upgrade
            {processing && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Downgrade to Resident Dialog */}
      <Dialog open={downgradeDialogOpen} onClose={() => setDowngradeDialogOpen(false)}>
        <DialogTitle>Downgrade to Resident</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ flexGrow: 1 }}>
            Are you sure you want to downgrade this staff member to a resident?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDowngradeDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleDowngradeToResident} color="warning" disabled={processing}>
            Downgrade
            {processing && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}

export default ViewUser