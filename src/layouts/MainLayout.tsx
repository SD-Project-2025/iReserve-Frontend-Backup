"use client"

import type React from "react"

import { useState } from "react"
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
  ChevronLeft as ChevronLeftIcon,
} from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"

const drawerWidth = 260

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

  const isAdmin = user?.type === "staff"

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
    { text: "Manage Maintenance", icon: <MaintenanceIcon />, path: "/admin/maintenance" },
    { text: "Manage Users", icon: <PersonIcon />, path: "/admin/users" },
    { text: "System Reports", icon: <ReportIcon />, path: "/admin/reports" },
  ]

  const drawer = (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "primary.main",
              mr: 1.5,
              fontWeight: "bold",
            }}
          >
            IR
          </Avatar>
          <Typography variant="h6" noWrap component="h1" fontWeight="bold">
            iReserve
          </Typography>
        </Box>
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />

      {user && (
        <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
          <Avatar src={user.picture} alt={user.name || "User"} sx={{ width: 40, height: 40, mr: 2 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
              {user.type} Account
            </Typography>
          </Box>
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
                "&.Mui-selected": {
                  color: "primary.main",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: location.pathname === item.path ? "primary.main" : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isAdmin && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="overline" color="text.secondary" sx={{ px: 3, py: 1, display: "block" }}>
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
                    "&.Mui-selected": {
                      color: "primary.main",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: location.pathname === item.path ? "primary.main" : "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </>
  )

  const drawerWidth = 260
  const collapsedDrawerWidth = 72
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
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
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
              aria-label="notifications"
              onClick={() => navigate("/notifications")}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile">
            <IconButton
              onClick={handleProfileMenuOpen}
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              color="inherit"
            >
              <Avatar alt={user?.name || "User"} src={user?.picture} sx={{ width: 32, height: 32 }} />
            </IconButton>
          </Tooltip>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem
              onClick={() => {
                handleProfileMenuClose()
                navigate("/profile")
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: actualDrawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
              overflowX: "hidden",
              transition: muiTheme.transitions.create("width", {
                easing: muiTheme.transitions.easing.sharp,
                duration: muiTheme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
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
