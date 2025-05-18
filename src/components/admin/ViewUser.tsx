"use client"
import React from "react"
import {
  Typography,

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
  Container,
  Paper,
  Stack,
  TextField,
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
import { api } from "@/services/api"

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

const ViewUser: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  const [staff, setStaff] = useState<Staff | null>(null)
  const [resident, setResident] = useState<Resident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const userType = location.state?.userType || user?.type || "unknown"
  const userData = location.state?.userData

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<{ id: number; action: string } | null>(null)
  const [dialogAdminAction, setDialogAdminAction] = useState<{
    id: number
    is_admin: boolean
  } | null>(null)
  const [employeeId, setEmployeeId] = useState("")
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

  const handleUpgradeToStaff = async () => {
    if (!user) return
    try {
      setProcessing(true)
      const code = "EMP"
      const employee_id = code + employeeId.trim()

      if (!employee_id) {
        setError("Employee ID is required.")
        setProcessing(false)
        return
      }

      const res = await api.post(`/manage/users/${user.user_id}/upgrade`, {
        employee_id,
      })

      if (res.data?.success) {
        setUser({ ...user, type: "staff" })
        setError(null)
        setSuccessMessage("User successfully upgraded to staff.")
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to upgrade user to staff. Please try again later."
      )
    } finally {
      setProcessing(false)
      setUpgradeDialogOpen(false)
      setEmployeeId("")
    }
  }

  const handleDowngradeToResident = async () => {
    if (!user) return
    try {
      setProcessing(true)
      const res = await api.post(`/manage/users/${user.user_id}/downgrade`)
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate("/admin/users")}
        sx={{ mb: 3 }}
        variant="outlined"
        color="inherit"
      >
        Back to Users
      </Button>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="center">
          <Avatar sx={{ width: 80, height: 80 }}>{user.name.charAt(0)}</Avatar>
          <Box textAlign={{ xs: "center", md: "left" }}>
            <Typography variant="h5" fontWeight="bold">
              {user.name}
            </Typography>
            <Typography color="text.secondary">{user.email}</Typography>
            <Chip
              label={user.status}
              color={getStatusColor(user.status)}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              <strong>User ID:</strong> {user.user_id}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Type:</strong> {userType}
            </Typography>

            {userType === "staff" && staff && (
              <>
                <Typography variant="subtitle1">
                  <strong>Employee ID:</strong> {staff.employee_id}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Position:</strong> {staff.position}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Department:</strong> {staff.department}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Admin:</strong> {staff.is_admin ? "Yes" : "No"}
                </Typography>
              </>
            )}

            {userType === "resident" && resident && (
              <>
                <Typography variant="subtitle1">
                  <strong>Membership Type:</strong> {resident.membership_type}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Start Date:</strong>{" "}
                  {new Date(resident.membership_start_date).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>End Date:</strong>{" "}
                  {new Date(resident.membership_end_date).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Address:</strong> {resident.encrypted_address}
                </Typography>
              </>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">
              <strong>Status:</strong>{" "}
              <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
            </Typography>
            <Typography variant="subtitle1">
              <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color={user.is_admin ? "error" : "success"}
            startIcon={<AdminIcon />}
            onClick={() => openAdminDialog(user.user_id, !user.is_admin)}
          >
            {user.is_admin ? "Revoke Admin" : "Make Admin"}
          </Button>

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

          <Button
            variant="contained"
            color={user.status === "active" ? "error" : "success"}
            startIcon={user.status === "active" ? <BlockIcon /> : <ActivateIcon />}
            onClick={() => openDialog(user.user_id, user.status === "active" ? "deactivate" : "activate")}
          >
            {user.status === "active" ? "Deactivate" : "Activate"} User
          </Button>
        </Box>
      </Paper>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{dialogAction?.action === "activate" ? "Activate User" : "Deactivate User"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {dialogAction?.action === "activate" ? "activate" : "deactivate"} this user?
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
            startIcon={processing && <CircularProgress size={20} />}
          >
            {dialogAction?.action === "activate" ? "Activate" : "Deactivate"}
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
            startIcon={processing && <CircularProgress size={20} />}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade to Staff Dialog */}
      <Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)}>
        <DialogTitle>Upgrade to Staff</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            margin="normal"
            helperText="Prefix will be added automatically (e.g., EMP123)"
          />
          <DialogContentText sx={{ mt: 2 }}>
            Are you sure you want to upgrade this user to a staff member?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleUpgradeToStaff}
            color="info"
            disabled={processing}
            startIcon={processing && <CircularProgress size={20} />}
          >
            Upgrade
          </Button>
        </DialogActions>
      </Dialog>

      {/* Downgrade to Resident Dialog */}
      <Dialog open={downgradeDialogOpen} onClose={() => setDowngradeDialogOpen(false)}>
        <DialogTitle>Downgrade to Resident</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to downgrade this staff member to a resident?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDowngradeDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleDowngradeToResident}
            color="warning"
            disabled={processing}
            startIcon={processing && <CircularProgress size={20} />}
          >
            Downgrade
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default ViewUser