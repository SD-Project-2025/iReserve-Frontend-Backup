"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material"
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  SportsTennis as SportsIcon,
  Event as EventIcon,
  CalendarMonth as BookingIcon,
  Build as MaintenanceIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Assessment as ReportIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Email as EmailIcon,
} from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { api } from "@/services/api"
import logo from "@/assets/logo.svg" 

const MainLayout = () => {
  const { user, logout } = useAuth()
  const { mode, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const muiTheme = useMuiTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))

  const [mobileOpen, setMobileOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [newNotificationsCount, setNewNotificationsCount] = useState<number>(0)

  const isAdmin = user?.type === "staff"
  const drawerWidth = 260
  const collapsedDrawerWidth = 72

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setDrawerOpen(!drawerOpen)
    }
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleProfileMenuClose()
    logout()
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const getUnreadNotificationsCount = async () => {
    try {
      const response = await api.get("/notifications", { params: { read: "false" } })
      return response.data.data.length
    } catch (error) {
      console.error("Error fetching unread notifications:", error)
      return 0
    }
  }

  useEffect(() => {
    const fetchNotificationsCount = async () => {
      const count = await getUnreadNotificationsCount()
      setNewNotificationsCount(count)
    }
    fetchNotificationsCount()
  }, [])

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Facilities", icon: <SportsIcon />, path: "/facilities" },
    { text: "Bookings", icon: <BookingIcon />, path: "/bookings" },
    { text: "Events", icon: <EventIcon />, path: "/events" },
    { text: "Maintenance", icon: <MaintenanceIcon />, path: "/maintenance" },
  ]

  const adminMenuItems = [
    { text: "Manage Facilities", icon: <SportsIcon />, path: "/admin/facilities" },
    { text: "Manage Bookings", icon: <BookingIcon />, path: "/admin/bookings" },
    { text: "Manage Events", icon: <EventIcon />, path: "/admin/events" },
    { text: "Emails Users", icon: <EmailIcon />, path: "/admin/emailUser" },
    { text: "Manage Maintenance", icon: <MaintenanceIcon />, path: "/admin/maintenance" },
    { text: "Manage Users", icon: <PersonIcon />, path: "/admin/users" },
    { text: "System Reports", icon: <ReportIcon />, path: "/admin/reports" },
  ]

  const drawer = (
    <>
      <Box sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        minHeight: 64
      }}>
        <Box onClick={() => handleNavigate("/")} sx={{ cursor: "pointer" }}>
         <img 
            src={logo} 
            alt="iReserve Logo" 
            style={{ 
              width: "100%",
              height: "auto",
              objectFit: "contain"
            }} 
          />
        </Box>
      </Box>

      <Divider />

      {user && (
        <Box sx={{ 
          p: 2, 
          display: { xs: "none", sm: "flex" }, 
          alignItems: "center",
          flexDirection: drawerOpen ? "row" : "column",
          justifyContent: "center"
        }}>
         
          
        </Box>
      )}

      <Divider sx={{ mb: 1 }} />

      <List component="nav" sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: "8px",
                mb: 0.5,
                justifyContent: "center",
                "&.Mui-selected": { color: "primary.main" }
              }}
            >
              <ListItemIcon sx={{
                minWidth: "auto",
                color: location.pathname === item.path ? "primary.main" : "inherit",
                ...(drawerOpen && { mr: 2 })
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ display: { xs: "none", sm: drawerOpen ? "block" : "none" } }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isAdmin && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{
              px: 3,
              py: 1,
              display: { xs: "none", sm: drawerOpen ? "block" : "none" },
              textAlign: "center"
            }}
          >
            Administration
          </Typography>
          <List component="nav" sx={{ px: 1 }}>
            {adminMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: "8px",
                    mb: 0.5,
                    justifyContent: "center",
                    "&.Mui-selected": { color: "primary.main" }
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: "auto",
                    color: location.pathname === item.path ? "primary.main" : "inherit",
                    ...(drawerOpen && { mr: 2 })
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ display: { xs: "none", sm: drawerOpen ? "block" : "none" } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </>
  )

  const actualDrawerWidth = isMobile ? 0 : drawerOpen ? drawerWidth : collapsedDrawerWidth

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${actualDrawerWidth}px)` },
          ml: { sm: `${actualDrawerWidth}px` },
          bgcolor: "background.paper",
          color: "text.primary",
          transition: muiTheme.transitions.create(["width", "margin"], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.leavingScreen,
          }),
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
              {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={() => navigate("/notifications")}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={newNotificationsCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile">
            <IconButton onClick={handleProfileMenuOpen} color="inherit">
              <Avatar alt={user?.name || "User"} src={user?.picture} sx={{ width: 32, height: 32 }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate("/profile") }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: actualDrawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: actualDrawerWidth,
              overflowX: "hidden",
              transition: muiTheme.transitions.create("width", {
                easing: muiTheme.transitions.easing.sharp,
                duration: muiTheme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${actualDrawerWidth}px)` },
          mt: "64px",
          minHeight: "calc(100vh - 64px)",
          transition: muiTheme.transitions.create(["width", "margin"], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default MainLayout