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
  CardActions,
} from "@mui/material"

interface Activity {
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
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : activities.length > 0 ? (
          <List disablePadding>
            {activities.map((activity, index) => (
              <Box key={activity.id}>
                {index > 0 && <Divider />}
                <ListItem
                  alignItems="flex-start"
                  sx={{ py: 1.5 }}
                  secondaryAction={
                    activity.status && (
                      <Chip label={activity.status} color={activity.statusColor || "default"} size="small" />
                    )
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
                </ListItem>
                {renderActions && <Box sx={{ pl: 2, pr: 2, pb: 1 }}>{renderActions(activity)}</Box>}
              </Box>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            {emptyMessage}
          </Typography>
        )}
      </CardContent>
      {(viewAllLink || viewAllAction) && (
        <CardActions>
          <Button size="small" onClick={viewAllAction} href={viewAllLink}>
            View All
          </Button>
        </CardActions>
      )}
    </Card>
  )
}

export default RecentActivityList
