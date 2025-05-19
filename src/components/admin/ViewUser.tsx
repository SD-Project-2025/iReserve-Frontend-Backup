"use client"

import React from "react"
import {
  Typography,
  Card,
  CardContent,
  Button,
  Box,
 
  Chip,
 
  Grid,
  CircularProgress,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import Snackbar from "@mui/material/Snackbar"
import MuiAlert, { AlertProps } from "@mui/material/Alert"
import {
  ArrowBack as BackIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  
  PersonAdd as PersonAddIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material"
import { api } from "@/services/api" // Adjust path if needed


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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
 
  const userData = location.state?.userData
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false)
  const [userType, setUserType] = useState(location.state?.userType || user?.type || "unknown")
  const [employeeId, setEmployeeId] = useState("")
  const [dialogAction, setDialogAction] = useState<{ id: number; action: string } | null>(null)
  const [dialogAdminAction, setDialogAdminAction] = useState<{ id: number; is_admin: boolean } | null>(null)
  const [processing, setProcessing] = useState(false)
  const [snackbar, setSnackbar] = useState<{
  open: boolean
  message: string
  severity: "success" | "error" | "info" | "warning"
}>({
  open: false,
  message: "",
  severity: "success",
})
  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)

        if (location.state?.userData) {
          setUser(location.state.userData)
          return
        }

        const response = await api.get(`/auth/me`)
       

        if (response.data) {
          setUser(response.data)
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
const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
  setSnackbar({ open: true, message, severity })
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
  showSnackbar("Admin privileges updated successfully", "success")
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
      const employeeIdInput = document.getElementById("employee-id") as HTMLInputElement
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
        setUserType("staff")
        setError(null)
        setEmployeeId(employee_id)
        // Show a success message on the UI
        setSuccessMessage("User successfully upgraded to staff.")
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
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
  const handleActivateDeactivateUser = async (status: string) => {
    if (!user) return
    try {
      setProcessing(true)
      const res = await api.put(`/manage/users/${user?.user_id}/status`, {
        status: status,
      })
      if (res.data?.success) {
        if(status === "active") {
          setUser({ ...user, status: "active" })
          showSnackbar("Status change.", "success")
        } else {
        setUser({ ...user, status: "suspended" })
        showSnackbar("Status change.", "success")
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to deactivate user. Please try again later."
      )
    } finally {
      setProcessing(false)
      setDialogOpen(false)
      setDialogAction(null)
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
  setUserType("resident")
  showSnackbar("User successfully downgraded to resident.", "success")
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
      <Snackbar
  open={snackbar.open}
  autoHideDuration={5000}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
>
  <Alert
    onClose={() => setSnackbar({ ...snackbar, open: false })}
    severity={snackbar.severity}
    sx={{ width: "100%" }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
      {successMessage && (
        <Alert severity="success" sx={{ my: 3 }}>
          {successMessage}
        </Alert>
      )}
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
              onClick={() => {
                openDialog(user.user_id, "deactivate");
                
              }}
              sx={{ whiteSpace: "nowrap" }}
              >
              Deactivate User
              </Button>
            ) : (
              <Button
              variant="contained"
              color="success"
              startIcon={<ActivateIcon />}
              onClick={() => {
                openDialog(user.user_id, "activate");
                 
              }}
              sx={{ whiteSpace: "nowrap" }}
              >
              Activate User
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>
    {dialogAction?.action === "activate" ? "Activate User" : "Deactivate User"}
  </DialogTitle>
  <DialogContent>
    <DialogContentText color="text.secondary">
      {dialogAction?.action === "activate"
        ? "Are you sure you want to activate this user? This will restore their access."
        : "Are you sure you want to deactivate this user? This will revoke their access."}
    </DialogContentText>
  </DialogContent>
  <DialogActions sx={{ p: 2, pt: 0 }}>
    <Button onClick={() => setDialogOpen(false)} disabled={processing} color="inherit">
      Cancel
    </Button>
    <Button
      onClick={() => handleActivateDeactivateUser(dialogAction?.action === "activate" ? "active" : "suspended")}
      variant="contained"
      color={dialogAction?.action === "activate" ? "success" : "error"}
      startIcon={processing && <CircularProgress size={20} />}
      disabled={processing}
    >
      {dialogAction?.action === "activate" ? "Activate" : "Deactivate"}
    </Button>
  </DialogActions>
</Dialog>

{/* Admin Toggle Dialog */}
<Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>
    {dialogAdminAction?.is_admin ? "Grant Admin Privileges" : "Revoke Admin Privileges"}
  </DialogTitle>
  <DialogContent>
    <DialogContentText color="text.secondary">
      {dialogAdminAction?.is_admin
        ? "Are you sure you want to make this user an admin? They will gain elevated permissions."
        : "Are you sure you want to revoke admin privileges from this user?"}
    </DialogContentText>
  </DialogContent>
  <DialogActions sx={{ p: 2, pt: 0 }}>
    <Button onClick={() => setAdminDialogOpen(false)} disabled={processing} color="inherit">
      Cancel
    </Button>
    <Button
      onClick={handleToggleAdmin}
      variant="contained"
      color={dialogAdminAction?.is_admin ? "success" : "error"}
      startIcon={processing && <CircularProgress size={20} />}
      disabled={processing}
    >
      Confirm
    </Button>
  </DialogActions>
</Dialog>

{/* Upgrade to Staff Dialog */}
<Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Upgrade to Staff</DialogTitle>
  <DialogContent>
    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
      Please enter the employee ID. A prefix like EMP will be added automatically.
    </Typography>
      <TextField
      autoFocus
      margin="dense"
      label="Employee ID"
      id="employee-id"
      type="text"
      fullWidth
      variant="outlined"
      value={employeeId}
      onChange={(e) => setEmployeeId(e.target.value)}
      helperText="Example: Entering '123' will result in 'EMP123'"
      disabled={processing}
    />
   
    <DialogContentText color="text.secondary" sx={{ mt: 2 }}>
      Are you sure you want to upgrade this user to a staff member?
    </DialogContentText>
  </DialogContent>
  <DialogActions sx={{ p: 2, pt: 0 }}>
    <Button onClick={() => setUpgradeDialogOpen(false)} disabled={processing} color="inherit">
      Cancel
    </Button>
    <Button
      onClick={handleUpgradeToStaff}
      variant="contained"
      color="info"
      startIcon={processing && <CircularProgress size={20} />}
     
    >
      Upgrade
    </Button>
  </DialogActions>
</Dialog>

{/* Downgrade to Resident Dialog */}
<Dialog open={downgradeDialogOpen} onClose={() => setDowngradeDialogOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Downgrade to Resident</DialogTitle>
  <DialogContent>
    <DialogContentText color="text.secondary">
      Are you sure you want to downgrade this staff member to a resident? All staff-related data may be removed.
    </DialogContentText>
  </DialogContent>
  <DialogActions sx={{ p: 2, pt: 0 }}>
    <Button onClick={() => setDowngradeDialogOpen(false)} disabled={processing} color="inherit">
      Cancel
    </Button>
    <Button
      onClick={handleDowngradeToResident}
      variant="contained"
      color="warning"
      startIcon={processing && <CircularProgress size={20} />}
      disabled={processing}
    >
      Downgrade
    </Button>
  </DialogActions>
</Dialog>
    </section>
  )
}

export default ViewUser