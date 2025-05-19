"use client"
import  { useState, useEffect } from "react"
import {

  
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

  Button,
  Tabs,
  Tab,
} from "@mui/material"
import { DataGrid, type GridColDef } from "@mui/x-data-grid"
import { Skeleton} from "@mui/material" // Added for skeletons and progress indicator
import { toast, ToastContainer } from "react-toastify" // Toast notifications
import "react-toastify/dist/ReactToastify.css"
import { useNavigate } from "react-router-dom"
import {
  Search as SearchIcon,
 
   
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
  
  const navigate = useNavigate()


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
          console.log("Staff Data:", staffRes.data.data)
    
         
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
        
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => {
                navigate(`/admin/users/${params.row.user_id}`,{state:{userType :params.row.user_type,userData:params.row}})
              }}
              sx={{ mb: 2 }}
            >
              View
            </Button>
            
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
              navigate(`/admin/users/${params.row.user_id}`,{state:{userType :"staff",userData:params.row}})
            }}
          >
            View
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
              navigate(`/admin/users/${params.row.user_id}`,{state:{userType :"resident",userData:params.row}})
              
            }}
            sx={{ mb: 2 }}
          >
            View
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
              <MenuItem value="inactive">suspended</MenuItem>
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


      </section>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />
    </>
  )
}

export default ManageUsersPage