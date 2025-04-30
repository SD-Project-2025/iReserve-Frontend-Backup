import type { ReactNode } from "react"
import { Card, CardContent, Typography, Box, type SxProps, type Theme } from "@mui/material"

interface DashboardCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color?: string
  sx?: SxProps<Theme>
  children?: ReactNode
}

const DashboardCard = ({ 
  title, 
  value, 
  icon, 
  color = "primary.main", 
  sx, 
  children 
}: DashboardCardProps) => {
  return (
    <Card sx={{ height: "100%", ...sx }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1.5,
              borderRadius: 1,
              bgcolor: `${color}15`,
              color: color,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="p" sx={{ mb: 1 }}>
          {value}
        </Typography>
        {children}
      </CardContent>
    </Card>
  )
}

export default DashboardCard