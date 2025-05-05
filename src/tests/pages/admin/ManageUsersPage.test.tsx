"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Button,
} from "@mui/material"
import { DataGrid, GridColDef } from "@mui/x-data-grid"
import { MoreVert } from "@mui/icons-material"

const ManageUsersPage = () => {
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<{ id: string; action: "deactivate" | "activate" } | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data)
        setFilteredUsers(data)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let filtered = users

    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter((user) =>
        [user.name, user.email].some((field) => field?.toLowerCase().includes(s))
      )
    }

    if (filterType) {
      filtered = filtered.filter((user) => user.type === filterType)
    }

    if (filterStatus) {
      filtered = filtered.filter((user) => user.status === filterStatus)
    }

    setFilteredUsers(filtered)
  }, [search, filterType, filterStatus, users])

  const handleUpdateUserStatus = async (id: string, status: string) => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const updated = await res.json()
      const updatedList = users.map((u) => (u.user_id === id ? updated : u))
      setUsers(updatedList)
      setDialogOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const columns: GridColDef[] = [
    { field: "user_id", headerName: "User ID", width: 120 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "type", headerName: "Type", width: 120 },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => {
        const user = params.row
        return (
          <Button
            variant="outlined"
            color={user.status === "active" ? "error" : "success"}
            size="small"
            onClick={() =>
              setDialogAction({
                id: user.user_id,
                action: user.status === "active" ? "deactivate" : "activate",
              }) || setDialogOpen(true)
            }
          >
            {user.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        )
      },
    },
  ]

  return (
    <section className="p-4">
      <Typography variant="h5" gutterBottom>
        Manage Users
      </Typography>

      <Card>
        <CardContent>
          <Grid container spacing={2} marginBottom={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Select
                fullWidth
                displayEmpty
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="resident">Resident</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Select
                fullWidth
                displayEmpty
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </Grid>
          </Grid>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <div style={{ height: 500, width: "100%" }}>
              <DataGrid
                rows={filteredUsers}
                columns={columns}
                getRowId={(row) => row.user_id}
                pageSizeOptions={[5, 10, 20]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                }}
                disableRowSelectionOnClick
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {dialogAction?.action === "deactivate" ? "Deactivate User" : "Activate User"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {dialogAction?.action} this user?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              handleUpdateUserStatus(dialogAction!.id, dialogAction!.action === "deactivate" ? "inactive" : "active")
            }
            color={dialogAction?.action === "deactivate" ? "error" : "success"}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}

export default ManageUsersPage
