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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  IconButton,
  Tooltip,
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
  Delete as DeleteIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
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
  last_login: string
  created_at: string
  status: string
}

interface Resident {
  resident_id: number
  user_id: number
  encrypted_address: string
  membership_type: string
  created_at: string
  last_login: string
  status: string
}

interface Facility {
  facility_id: number
  name: string
  type: string
  location: string
  capacity: number
  status: string
}

interface Assignment {
  assignment_id: number
  role: string
  assigned_date: string
  is_primary: boolean
  facility_id: number
  name: string
  type: string
  location: string
  capacity: number
  status: string
  open_time: string
  close_time: string
  image_url: string
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
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [addAssignmentModalOpen, setAddAssignmentModalOpen] = useState(false)
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null)
  const [processingAssignment, setProcessingAssignment] = useState(false)
  const userData = location.state?.userData
  
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
          switch (location.state.userType) {
            case "staff":
              setStaff(location.state.userData)
              setUserType("staff")
              break
            case "resident":
              setResident(location.state.userData)
              setUserType("resident")
              break
            default:
              setUserType("resident")
              break
          }
          setUser(location.state.userData)
          setLoading(false)
          return
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

  useEffect(() => {
    if (userType === 'staff') {
      fetchAssignments()
    }
  }, [userType, id])

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/manage/users/${id}/assignments`)
      console.log("Assignments response:", response.data)
      setAssignments(response.data.data)

    } catch (error) {
      showSnackbar('Failed to load assignments', 'error')
    }
  }

  const fetchFacilities = async () => {
    try {
      const response = await api.get("/facilities")
      setFacilities(response.data.data)
    } catch (error) {
      showSnackbar('Failed to load facilities', 'error')
    }
  }

  const handleAddAssignment = async () => {
    if (!selectedFacilityId) return
    
    try {
      setProcessingAssignment(true)
      await api.post("/manage/users/staff/assign", {
        userId: id,
        facilityId: selectedFacilityId
      })
      await fetchAssignments()
      showSnackbar('Assignment added successfully', 'success')
      setAddAssignmentModalOpen(false)
    } catch (error) {
      showSnackbar('Failed to add assignment', 'error')
    } finally {
      setProcessingAssignment(false)
    }
  }

  const handleRemoveAssignment = async (facilityId: number) => {
    try {
      setProcessingAssignment(true)
      await api.delete(`/manage/users/staff/unassign?userId=${id}&facilityId=${facilityId}`)
      await fetchAssignments()
      showSnackbar('Assignment removed successfully', 'success')
    } catch (error) {
      showSnackbar('Failed to remove assignment', 'error')
    } finally {
      setProcessingAssignment(false)
    }
  }

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbar({ open: true, message, severity })
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

  const handleUpgradeToStaff = async () => {
    if (!user) return
    try {
      setProcessing(true)
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
          showSnackbar("Status changed successfully", "success")
        } else {
          setUser({ ...user, status: "suspended" })
          showSnackbar("Status changed successfully", "success")
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to update status. Please try again later."
      )
    } finally {
      setProcessing(false)
      setDialogOpen(false)
      setDialogAction(null)
    }
  }

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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress size={60} />
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
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
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
        sx={{ mb: 3 }}
        variant="outlined"
        size="large"
      >
        Back to Users
      </Button>

      {/* Enhanced Profile Card */}
      <Card 
        sx={{ 
          mb: 4, 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          position: "relative",
          overflow: "visible"
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                mr: 4,
                fontSize: "2.5rem",
                bgcolor: "rgba(255,255,255,0.2)",
                border: "4px solid rgba(255,255,255,0.3)"
              }}
            >
              {user.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
                {user.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <EmailIcon sx={{ mr: 1, opacity: 0.8 }} />
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {user.email}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip 
                  label={userType.toUpperCase()} 
                  sx={{ 
                    bgcolor: "rgba(255,255,255,0.2)", 
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.9rem"
                  }} 
                />
                <Chip 
                  label={user.status.toUpperCase()} 
                  color={getStatusColor(user.status)} 
                  sx={{ fontWeight: 600 }}
                />
                {user.is_admin && (
                  <Chip 
                    label="ADMIN" 
                    sx={{ 
                      bgcolor: "#ff6b35", 
                      color: "white",
                      fontWeight: 600
                    }} 
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* User Details Card */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: "primary.main" }}>
            User Information
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <BadgeIcon sx={{ mr: 2, color: "primary.main" }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      User ID
                    </Typography>
                    <Typography variant="h6">
                      {user.user_id}
                    </Typography>
                  </Box>
                </Box>

                {userType === "staff" && staff && (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <BadgeIcon sx={{ mr: 2, color: "primary.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Employee ID
                        </Typography>
                        <Typography variant="h6">
                          {staff.employee_id}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <WorkIcon sx={{ mr: 2, color: "primary.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Position
                        </Typography>
                        <Typography variant="h6">
                          {staff?.position || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <BusinessIcon sx={{ mr: 2, color: "primary.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="h6">
                          {staff.department || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}

                {userType === "resident" && resident && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PersonAddIcon sx={{ mr: 2, color: "primary.main" }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Membership Type
                      </Typography>
                      <Typography variant="h6">
                        {resident.membership_type}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarIcon sx={{ mr: 2, color: "primary.main" }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Joined Date
                    </Typography>
                    <Typography variant="h6">
                      {new Date(user.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                {((userType === "staff" && staff) || (userType === "resident" && resident)) && (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <ScheduleIcon sx={{ mr: 2, color: "primary.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Account Created
                        </Typography>
                        <Typography variant="h6">
                          {new Date(
                            userType === "staff" ? staff!.created_at : resident!.created_at
                          ).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <ScheduleIcon sx={{ mr: 2, color: "primary.main" }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Login
                        </Typography>
                        <Typography variant="h6">
                          {new Date(
                            userType === "staff" ? staff!.last_login : resident!.last_login
                          ).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Enhanced Facility Assignments Section */}
      {userType === "staff" && (
        <Card sx={{ mb: 4, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3 
            }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: "primary.main" }}>
                Facility Assignments
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  setAddAssignmentModalOpen(true)
                  fetchFacilities()
                }}
                sx={{ 
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600
                }}
              >
                Add Assignment
              </Button>
            </Box>

            {assignments.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <BusinessIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No facility assignments found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This staff member hasn't been assigned to any facilities yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: "1rem" }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <BusinessIcon sx={{ mr: 1 }} />
                          Facility
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "1rem" }}>
                        Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "1rem" }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <LocationIcon sx={{ mr: 1 }} />
                          Location
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "1rem" }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <CalendarIcon sx={{ mr: 1 }} />
                          Assigned Date
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "1rem" }} align="center">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow 
                        key={assignment.assignment_id}
                        sx={{ 
                          '&:nth-of-type(odd)': { bgcolor: 'grey.25' },
                          '&:hover': { bgcolor: 'action.hover' },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {assignment.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={assignment.type} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {assignment.location}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(assignment.assigned_date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Remove Assignment">
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveAssignment(assignment.facility_id)}
                              disabled={processingAssignment}
                              sx={{ 
                                '&:hover': { 
                                  bgcolor: 'error.light',
                                  color: 'white'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Action Buttons */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: "primary.main" }}>
            User Management Actions
          </Typography>
          
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="flex-end">
            {userType === 'staff' && (
    <Button
      variant="contained"
      color={user.is_admin ? "error" : "success"}
      startIcon={<AdminIcon />}
      onClick={() => openAdminDialog(user.user_id, !user.is_admin)}
      sx={{ 
        borderRadius: 2,
        textTransform: "none",
        fontWeight: 600,
        minWidth: 160
      }}
    >
      {user.is_admin ? "Revoke Admin" : "Make Admin"}
    </Button>
  )}

            {userType === "resident" ? (
              <Button
                variant="contained"
                color="info"
                startIcon={<WorkIcon />}
                onClick={openUpgradeDialog}
                sx={{ 
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  minWidth: 160
                }}
              >
                Upgrade to Staff
              </Button>
            ) : (
              <Button
                variant="contained"
                color="warning"
                startIcon={<PersonAddIcon />}
                onClick={openDowngradeDialog}
                sx={{ 
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  minWidth: 160
                }}
              >
                Downgrade to Resident
              </Button>
            )}

            {user.status === "active" ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<BlockIcon />}
                onClick={() => openDialog(user.user_id, "deactivate")}
                sx={{ 
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  minWidth: 160
                }}
              >
                Deactivate User
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<ActivateIcon />}
                onClick={() => openDialog(user.user_id, "activate")}
                sx={{ 
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  minWidth: 160
                }}
              >
                Activate User
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Assignment Management Dialog */}
      <Dialog 
        open={addAssignmentModalOpen} 
        onClose={() => setAddAssignmentModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontSize: "1.5rem", fontWeight: 600 }}>
          Assign Facility
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Select Facility"
              value={selectedFacilityId || ''}
              onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              {facilities.map((facility) => (
                <MenuItem key={facility.facility_id} value={facility.facility_id}>
                  {facility.name} ({facility.type})
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setAddAssignmentModalOpen(false)}
            color="inherit"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddAssignment}
            variant="contained"
            disabled={!selectedFacilityId || processingAssignment}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {processingAssignment ? <CircularProgress size={24} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Existing Dialogs with Enhanced Styling */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontSize: "1.5rem", fontWeight: 600 }}>
          {dialogAction?.action === "activate" ? "Activate User" : "Deactivate User"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary" sx={{ fontSize: "1rem" }}>
            {dialogAction?.action === "activate"
              ? "Are you sure you want to activate this user? This will restore their access."
              : "Are you sure you want to deactivate this user? This will revoke their access."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            disabled={processing} 
            color="inherit"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleActivateDeactivateUser(dialogAction?.action === "activate" ? "active" : "suspended")}
            variant="contained"
            color={dialogAction?.action === "activate" ? "success" : "error"}
            startIcon={processing && <CircularProgress size={20} />}
            disabled={processing}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {dialogAction?.action === "activate" ? "Activate" : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={adminDialogOpen} 
        onClose={() => setAdminDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontSize: "1.5rem", fontWeight: 600 }}>
          {dialogAdminAction?.is_admin ? "Grant Admin Privileges" : "Revoke Admin Privileges"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary" sx={{ fontSize: "1rem" }}>
            {dialogAdminAction?.is_admin
              ? "Are you sure you want to make this user an admin? They will gain elevated permissions."
              : "Are you sure you want to revoke admin privileges from this user?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setAdminDialogOpen(false)} 
            disabled={processing} 
            color="inherit"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleToggleAdmin}
            variant="contained"
            color={dialogAdminAction?.is_admin ? "success" : "error"}
            startIcon={processing && <CircularProgress size={20} />}
            disabled={processing}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={upgradeDialogOpen} 
        onClose={() => setUpgradeDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Upgrade to Staff
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1, fontSize: "1rem" }}>
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
  onChange={(e) => {
    // Allow only numeric input
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    setEmployeeId(numericValue);
  }}
  helperText="Example: Entering '123' will result in 'EMP123'"
  disabled={processing}
  inputProps={{
    inputMode: 'numeric', // Show numeric keyboard on mobile
    pattern: '[0-9]*' // HTML pattern validation
  }}
  sx={{ 
    mt: 2,
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
  }}
/>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setUpgradeDialogOpen(false)} 
            disabled={processing} 
            color="inherit"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpgradeToStaff}
            variant="contained"
            color="info"
            startIcon={processing && <CircularProgress size={20} />}
            disabled={processing}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Upgrade
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={downgradeDialogOpen} 
        onClose={() => setDowngradeDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Downgrade to Resident
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary" sx={{ fontSize: "1rem" }}>
            Are you sure you want to downgrade this staff member to a resident? All staff-related data may be removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDowngradeDialogOpen(false)} 
            disabled={processing} 
            color="inherit"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDowngradeToResident}
            variant="contained"
            color="warning"
            startIcon={processing && <CircularProgress size={20} />}
            disabled={processing}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Downgrade
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ViewUser