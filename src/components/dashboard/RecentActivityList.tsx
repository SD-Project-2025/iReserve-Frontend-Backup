"use client"

import type { ReactNode } from "react"
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
  //@ts-ignore
  CardActions,
  CircularProgress,
  Alert
} from "@mui/material"
import { Link } from "react-router-dom"

interface Activity {
  rawData: any
  id: number
  title: string
  subtitle?: string
  date: string
  status?: string
  statusColor?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
}

interface RecentActivityListProps {
  title: string
  activities: Activity[]
  emptyMessage: string
  loading: boolean
  viewAllLink?: string
  viewAllAction?: () => void
  renderActions?: (activity: Activity) => ReactNode
}

const RecentActivityList = ({
  title,
  activities,
  emptyMessage,
  loading,
  viewAllLink,
  viewAllAction,
  renderActions,
}: RecentActivityListProps) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          {(viewAllLink || viewAllAction) && (
            <Button 
              size="small" 
              onClick={viewAllAction} 
              component={viewAllLink ? Link : Button} 
              to={viewAllLink}
            >
              View All
            </Button>
          )}
        </Box>
        
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : activities.length > 0 ? (
          <List disablePadding>
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ py: 1.5 }}
                  secondaryAction={
                    renderActions && renderActions(activity)
                  }
                >
                  <ListItemText
                    primary={activity.title}
                    secondary={
                      <Box component="span">
                        {activity.subtitle && (
                          <Typography component="span" variant="body2" display="block">
                            {activity.subtitle}
                          </Typography>
                        )}
                        <Typography component="span" variant="caption" color="text.secondary">
                          {activity.date}
                        </Typography>
                      </Box>
                    }
                  />
                  {activity.status && (
                    <Chip 
                      label={activity.status} 
                      color={activity.statusColor || "default"} 
                      size="small" 
                      sx={{ ml: 2 }}
                    />
                  )}
                </ListItem>
                {index < activities.length - 1 && <Divider />}
              </div>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            {emptyMessage}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivityList