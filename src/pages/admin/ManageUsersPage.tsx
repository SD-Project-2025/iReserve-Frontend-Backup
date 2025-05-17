"use client"
import  { useState, useEffect } from "react"
import {
  Typography,
  
  Card,
  CardContent,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tabs,
  Tab,
} from "@mui/material"
import { DataGrid, type GridColDef } from "@mui/x-data-grid"
import { Skeleton, CircularProgress } from "@mui/material" // Added for skeletons and progress indicator
import { toast, ToastContainer } from "react-toastify" // Toast notifications
import "react-toastify/dist/ReactToastify.css"
import { useNavigate } from "react-router-dom"
import {
  Search as SearchIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Visibility as ViewIcon,
  PersonOutline as PersonIcon,
  PeopleAlt as PeopleIcon,
  Work as WorkIcon,
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

const ManageUsersPage = () => {
  const [tabValue, setTabValue] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem("userSearch") || "")
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem("userStatus") || "all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<{ id: number; action: string } | null>(null)
  const [dialogAdminAction, setDialogAdminAction] = useState<{ id: number; is_admin: boolean } | null>(
    null
  )
  const [dialogUpgradeId, setDialogUpgradeId] = useState<number | null>(null)
  const [dialogDowngradeId, setDialogDowngradeId] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)
  const navigate = useNavigate()
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [quickViewUser] = useState<User | null>(null)

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem("userSearch", searchTerm)
  }, [searchTerm])

  useEffect(() => {
    localStorage.setItem("userStatus", filterStatus)
  }, [filterStatus])

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [userRes, staffRes, residentRes] = await Promise.all([
          api.get("/manage/users"),
          api.get("/manage/users/staff"),
          api.get("/manage/users/residents"),
        ])
        if (userRes.data?.data) setUsers(userRes.data.data)
        if (staffRes.data?.data) setStaff(staffRes.data.data)
        if (residentRes.data?.data) setResidents(residentRes.data.data)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        toast.error("Failed to load user data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Update filtered data based on current tab and filters
  useEffect(() => {
    let result: any[] = []
    switch (tabValue) {
      case 0:
        result = users
        break
      case 1:
        result = staff.map((s) => ({
          ...s,
          name: users.find((u) => u.user_id === s.user_id)?.name || "Unknown",
          email: users.find((u) => u.user_id === s.user_id)?.email || "",
          status: users.find((u) => u.user_id === s.user_id)?.status || "inactive",
        }))
        break
      case 2:
        result = residents.map((r) => ({
          ...r,
          name: users.find((u) => u.user_id === r.user_id)?.name || "Unknown",
          email: users.find((u) => u.user_id === r.user_id)?.email || "",
          status: users.find((u) => u.user_id === r.user_id)?.status || "inactive",
        }))
        break
    }

    if (searchTerm) {
      result = result.filter(
        (item) =>
          (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (item.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (item.user_id?.toString() || "").includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== "all") {
      result = result.filter((item) => item.status === filterStatus)
    }

    setFilteredData(result)
  }, [tabValue, users, staff, residents, searchTerm, filterStatus])

  // Handlers for actions
  const handleUpdateUserStatus = async (userId: number, status: string) => {
    try {
      setProcessing(true)
      const res = await api.put(`/manage/users/${userId}/status`, { status })
      if (res.data?.success) {
        setUsers((prev) =>
          prev.map((user) => (user.user_id === userId ? { ...user, status } : user))
        )
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user status.")
    } finally {
      setProcessing(false)
      setDialogOpen(false)
      setDialogAction(null)
    }
  }

  const handleToggleAdmin = async () => {
    if (!dialogAdminAction) return
    try {
      setProcessing(true)
      const res = await api.put(`/manage/users/${dialogAdminAction.id}/admin`, {
        is_admin: dialogAdminAction.is_admin,
      })
      if (res.data?.success) {
        setUsers((prev) =>
          prev.map((user) =>
            user.user_id === dialogAdminAction.id
              ? { ...user, is_admin: dialogAdminAction.is_admin }
              : user
          )
        )
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update admin privileges.")
    } finally {
      setProcessing(false)
      setAdminDialogOpen(false)
      setDialogAdminAction(null)
    }
  }

  const handleUpgradeToStaff = async () => {
    if (!dialogUpgradeId) return
    try {
      setProcessing(true)
      const res = await api.post(`/manage/users/${dialogUpgradeId}/upgrade`, {
        employee_id: "EMP12345",
        position: "Facility Manager",
        department: "Operations",
      })
      if (res.data?.success) {
        setUsers((prev) =>
          prev.map((user) =>
            user.user_id === dialogUpgradeId
              ? { ...res.data.data, user_type: "staff" }
              : user
          )
        )
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upgrade user to staff.")
    } finally {
      setProcessing(false)
      setUpgradeDialogOpen(false)
      setDialogUpgradeId(null)
    }
  }

  const handleDowngradeToResident = async () => {
    if (!dialogDowngradeId) return
    try {
      setProcessing(true)
      const res = await api.post(`/manage/users/${dialogDowngradeId}/downgrade`)
      if (res.data?.success) {
        setUsers((prev) =>
          prev.map((user) =>
            user.user_id === dialogDowngradeId
              ? { ...user, user_type: "resident", is_admin: false }
              : user
          )
        )
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to downgrade user to resident.")
    } finally {
      setProcessing(false)
      setDowngradeDialogOpen(false)
      setDialogDowngradeId(null)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "resident":
        return (
          <Chip label="Resident" color="default" size="small" icon={<PersonIcon fontSize="small" />} />
        )
      case "staff":
        return (
          <Chip label="Staff" color="primary" size="small" icon={<WorkIcon fontSize="small" />} />
        )
      default:
        return type
    }
  }

  // Dialog open helpers
  const openDialog = (id: number, action: string) => {
    setDialogAction({ id, action })
    setDialogOpen(true)
  }
  const openAdminDialog = (id: number, makeAdmin: boolean) => {
    setDialogAdminAction({ id, is_admin: makeAdmin })
    setAdminDialogOpen(true)
  }
  const openUpgradeDialog = (id: number) => {
    setDialogUpgradeId(id)
    setUpgradeDialogOpen(true)
  }
  const openDowngradeDialog = (id: number) => {
    setDialogDowngradeId(id)
    setDowngradeDialogOpen(true)
  }

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success"
      case "inactive":
        return "error"
      default:
        return "default"
    }
  }

  // Columns for each tab
  const userColumns: GridColDef[] = [
    { field: "user_id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusColor(params.value)} size="small" />
      ),
    },
    {
      field: "created_at",
      headerName: "Joined",
      width: 120,
      valueGetter: (params) => new Date(params.row.created_at).toLocaleDateString(),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 280,
      renderCell: (params) => {
        const isAdmin = params.row.is_admin ?? false
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => {
                navigate(`/admin/users/${params.row.user_id}`)
              }}
              sx={{ mb: 2 }}
            >
              View
            </Button>
            <Button
              size="small"
              color={isAdmin ? "error" : "success"}
              onClick={() => openAdminDialog(params.row.user_id, !isAdmin)}
            >
              {isAdmin ? "Revoke Admin" : "Make Admin"}
            </Button>
            {params.row.status === "active" ? (
              <Button
                size="small"
                color="error"
                startIcon={<BlockIcon />}
                onClick={() => openDialog(params.row.user_id, "deactivate")}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                size="small"
                color="success"
                startIcon={<ActivateIcon />}
                onClick={() => openDialog(params.row.user_id, "activate")}
              >
                Activate
              </Button>
            )}
          </Box>
        )
      },
    },
  ]

  const staffColumns: GridColDef[] = [
    { field: "staff_id", headerName: "Staff ID", width: 100 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    { field: "position", headerName: "Position", width: 200 },
    { field: "department", headerName: "Department", width: 200 },
    {
      field: "is_admin",
      headerName: "Admin",
      width: 100,
      valueGetter: (params) => (params.row.is_admin ? "Yes" : "No"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 280,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => {
              navigate(`/admin/users/${params.row.user_id}`)
            }}
          >
            View
          </Button>
          <Button
            size="small"
            color="warning"
            onClick={() => openDowngradeDialog(params.row.user_id)}
          >
            Downgrade
          </Button>
        </Box>
      ),
    },
  ]

  const residentColumns: GridColDef[] = [
    { field: "resident_id", headerName: "Resident ID", width: 100 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    {
      field: "membership_type",
      headerName: "Membership",
      width: 150,
      valueGetter: (params) => params.row.membership_type,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 280,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => {
              navigate(`/admin/users/${params.row.user_id}`)
            }}
            sx={{ mb: 2 }}
          >
            View
          </Button>
          <Button
            size="small"
            color="info"
            onClick={() => openUpgradeDialog(params.row.user_id)}
          >
            Upgrade
          </Button>
        </Box>
      ),
    },
  ]

  return (
    <>
      <section style={{ padding: "2rem" }}>
        
        {/* Navigation Tabs */}
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            centered
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<PersonIcon />} label="All Users" />
            <Tab icon={<WorkIcon />} label="Staff Members" />
            <Tab icon={<PeopleIcon />} label="Residents" />
          </Tabs>
        </Card>

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField
            size="small"
            label="Search"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: "200px" }}
          />
          <FormControl size="small" sx={{ minWidth: "150px" }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {/* Data Table */}
        <Card sx={{ height: 600, boxShadow: 2 }}>
          <CardContent>
            {loading ? (
              <>
                {[...Array(10)].map((_, index) => (
                  <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Skeleton variant="text" width="10%" />
                    <Skeleton variant="text" width="25%" />
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="15%" />
                    <Skeleton variant="text" width="10%" />
                    <Skeleton variant="text" width="100px" />
                  </Box>
                ))}
              </>
            ) : (
              <DataGrid
                rows={filteredData}
                columns={
                  tabValue === 0 ? userColumns : tabValue === 1 ? staffColumns : residentColumns
                }
                getRowId={(row) =>
                  `${tabValue}-${row.user_id || row.staff_id || row.resident_id}`
                }
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                checkboxSelection={false}
                disableRowSelectionOnClick
              />
            )}
          </CardContent>
        </Card>

        {/* Action Dialogs */}
        {/* Status Update Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>
            {dialogAction?.action === "activate" ? "Activate User" : "Deactivate User"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {dialogAction?.action === "activate"
                ? "Are you sure you want to activate this user? Activating a user will grant them access to the platform and its features."
                : "Are you sure you want to deactivate this user? Deactivating a user will restrict their access to the platform and its features."}
            </DialogContentText>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Please confirm your action. This change will take effect immediately and the user will be
              notified of the status update.
            </Typography>
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
            <DialogContentText>
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

        <Dialog open={quickViewOpen} onClose={() => setQuickViewOpen(false)}>
          <DialogTitle>{quickViewUser?.name}</DialogTitle>
          <DialogContent>
            <DialogContentText>Email: {quickViewUser?.email}</DialogContentText>
            <DialogContentText>
              Type: {getTypeLabel(quickViewUser?.user_type || "")}
            </DialogContentText>
            <DialogContentText>Status: {quickViewUser?.status}</DialogContentText>
            <DialogContentText>
              Joined:{" "}
              {new Date(quickViewUser?.created_at || "").toLocaleDateString()}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuickViewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </section>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />
    </>
  )
}

export default ManageUsersPage