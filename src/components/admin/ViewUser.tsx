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
import { api } from "@/services/api"

interface User {
  user_id: number
  name: string
  email: string
  user_type: string
  status: string
  created_at: string
  is_admin?: boolean
}

interface Staff {
  user_id: number
  created_at: string
  department: string
  email: string
  employee_id: string
  is_admin: boolean
  last_login: string
  name: string
  position: string
  status: string

}

interface Resident {
  user_id: number
  created_at: string
  email: string | null
  last_login: string
  membership_type: string
  name: string | null
  status: string
}

const ViewUser: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const userType = location.state?.userType || "resident" // default to resident
  const [user, setUser] = useState<User | Staff | Resident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)

        let endpoint = ""

        switch (userType) {
          case "resident":
            endpoint = `/manage/users/residents`
            break
          case "staff":
            endpoint = `/manage/users/staff`
            break
          default:
            endpoint = `/manage/users`
        }

        const response = await api.get(endpoint)
        const foundUser = response.data.data.find(
          (u: User | Staff | Resident) => u.user_id.toString() === id
        )

        if (foundUser) {
          setUser(foundUser)
        } else {
          setError("User not found")
        }
      } catch (err: any) {
        console.error("Error fetching user:", err)
        setError(
          err.response?.data?.message ||
            `Failed to load ${userType}. Please try again later.`
        )
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id, location.state, userType])

  const handleUpdateUserStatus = async () => {
    if (!dialogAction || !user) return
    try {
      setProcessing(true)
      const newStatus = dialogAction.action === "activate" ? "active" : "inactive"
      const res = await api.put(`/manage/users/${user.user_id}/status`, {
        status: newStatus,
      })
      if (res.data?.success) {
        setUser({ ...user, status: newStatus })
        setError(null)
      }
    } catch (err: any) {
      console.error("Error updating user status:", err)
      setError(
        err.response?.data?.message ||
          `Failed to update ${userType} status. Please try again later.`
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
        err.response?.data?.message ||
          `Failed to update admin privileges for ${userType}. Please try again later.`
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
      const res = await api.post(`/manage/users/${user.user_id}/upgrade`, {
        employee_id: "EMP12345",
        position: "Facility Manager",
        department: "Operations",
      })
      if (res.data?.success) {
        setUser({ ...user, user_type: "staff" })
        setError(null)
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to upgrade user to staff. Please try again later."
      )
    } finally {
      setProcessing(false)
      setUpgradeDialogOpen(false)
    }
  }

  const handleDowngradeToResident = async () => {
    if (!user) return
    try {
      setProcessing(true)
      const res = await api.post(`/manage/users/${user.user_id}/downgrade`)
      if (res.data?.success) {
        setUser({ ...user, user_type: "resident", is_admin: false })
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
        No {userType} data available
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
              {user.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1">
                {user.name || "N/A"}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {user.email || "No Email"}
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
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong>{" "}
                <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}
              </Typography>
              {"last_login" in user && (
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Last Login:</strong>{" "}
                  {user.last_login
                    ? new Date(user.last_login).toLocaleString()
                    : "Never logged in"}
                </Typography>
              )}
              {"membership_type" in user && (
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Membership Type:</strong> {user.membership_type}
                </Typography>
              )}
              {"employee_id" in user && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Employee ID:</strong> {user.employee_id}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Position:</strong> {user.position}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Department:</strong> {user.department}
                  </Typography>
                </>
              )}
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
            {/* Toggle Admin Role */}
            <Button
              variant="contained"
              color={"is_admin" in user && user.is_admin ? "error" : "success"}
              startIcon={<AdminIcon />}
              onClick={() =>
                "is_admin" in user && openAdminDialog(user.user_id, !user.is_admin)
              }
            >
              {"is_admin" in user && user.is_admin ? "Revoke Admin" : "Make Admin"}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
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
      <Dialog
        open={adminDialogOpen}
        onClose={() => setAdminDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
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
      <Dialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Upgrade to Staff</DialogTitle>
        <DialogContent>
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
      <Dialog
        open={downgradeDialogOpen}
        onClose={() => setDowngradeDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
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