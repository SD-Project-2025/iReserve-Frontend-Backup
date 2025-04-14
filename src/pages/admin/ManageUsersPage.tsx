"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid"
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material"

interface User {
  user_id: number
  name: string
  email: string
  type: string
  status: string
  created_at: string
}

const ManageUsersPage = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<{ id: number; action: string } | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)

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
          {
            user_id: 4,
            name: "Alice Williams",
            email: "alice.williams@example.com",
            type: "staff",
            status: "active",
            created_at: "2023-04-05T00:00:00.000Z",
          },
          {
            user_id: 5,
            name: "Charlie Brown",
            email: "charlie.brown@example.com",
            type: "resident",
            status: "active",
            created_at: "2023-05-12T00:00:00.000Z",
          },
        ]

        setUsers(mockUsers)
        setFilteredUsers(mockUsers)
      } catch (err) {
        console.error("Error fetching users:", err)
        setError("Failed to load users. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = users

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by type
    if (filterType !== "all") {
      result = result.filter((user) => user.type === filterType)
    }

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((user) => user.status === filterStatus)
    }

    setFilteredUsers(result)
  }, [searchTerm, filterType, filterStatus, users])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleTypeChange = (event: any) => {
    setFilterType(event.target.value)
  }

  const handleStatusChange = (event: any) => {
    setFilterStatus(event.target.value)
  }

  const handleUpdateUserStatus = async (userId: number, status: string) => {
    try {
      setProcessing(true)
      // In a real app, you would call an API endpoint
      // await api.put(`/users/${userId}/status`, { status })

      // For now, we'll update the mock data
      setUsers((prev) => prev.map((user) => (user.user_id === userId ? { ...user, status } : user)))
      setDialogOpen(false)
      setDialogAction(null)
    } catch (err) {
      console.error("Error updating user status:", err)
      setError("Failed to update user status. Please try again later.")
    } finally {
      setProcessing(false)
    }
  }

  const openDialog = (id: number, action: string) => {
    setDialogAction({ id, action })
    setDialogOpen(true)
  }

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

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "resident":
        return "Resident"
      case "staff":
        return "Staff"
      default:
        return type
    }
  }

  const columns: GridColDef[] = [
    { field: "user_id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    {
      field: "type",
      headerName: "Type",
      width: 120,
      valueGetter: (params) => getTypeLabel(params.row.type),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getStatusColor(params.value as string) as any} size="small" />
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
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" startIcon={<ViewIcon />} onClick={() => navigate(`/admin/users/${params.row.user_id}`)}>
            View
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
      ),
    },
  ]

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Users
        </Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => navigate("/admin/users/create")}>
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search users"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="type-filter-label">Type</InputLabel>
                <Select labelId="type-filter-label" value={filterType} label="Type" onChange={handleTypeChange}>
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="resident">Resident</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select labelId="status-filter-label" value={filterStatus} label="Status" onChange={handleStatusChange}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <div style={{ height: 600, width: "100%" }}>
              <DataGrid
                rows={filteredUsers}
                columns={columns}
                getRowId={(row) => row.user_id}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                checkboxSelection
                disableRowSelectionOnClick
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{dialogAction?.action === "activate" ? "Activate User" : "Deactivate User"}</DialogTitle>
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
              handleUpdateUserStatus(dialogAction.id, dialogAction.action === "activate" ? "active" : "inactive")
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
  )
}

export default ManageUsersPage
