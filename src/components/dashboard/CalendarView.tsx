import { Card, CardContent, Typography } from "@mui/material";
import { DateCalendar, PickersDay } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { isSameDay } from "date-fns";
import { Booking } from "../../types/dashboardTypes";

interface CalendarViewProps {
  bookings: Booking[];
}

const CalendarView = ({ bookings }: CalendarViewProps) => {
  const bookingDates = bookings
    .filter((b) => b?.date && (b.status === "approved" || b.status === "pending"))
    .map((b) => ({
      date: new Date(new Date(b.date).setHours(0, 0, 0, 0)),
      status: b.status,
    }));

  const CustomDay = (props: any) => {
    const { day, outsideCurrentMonth, ...other } = props;
  
    const normalizedDay = new Date(day);
    normalizedDay.setHours(0, 0, 0, 0);
  
    const booking = bookingDates.find((b) => isSameDay(b.date, normalizedDay));

    let backgroundColor = "";
    let hoverColor = "";
  
    if (booking) {
      if (booking.status === "approved") {
        backgroundColor = "green";
        hoverColor = "darkgreen";
      } else if (booking.status === "pending") {
        backgroundColor = "orange";
        hoverColor = "darkorange";
      }
    }
    const isApprovedDay = bookingDates.some((booking) => isSameDay(booking.date, day) && booking.status === "approved");
    const isPendingDay = bookingDates.some((booking) => isSameDay(booking.date, day) && booking.status === "pending");    
    return (
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
        sx={{
          ...(isApprovedDay && {
           backgroundColor: backgroundColor,
            color: "white",
            "&:hover": {
              backgroundColor: hoverColor,
            },
          }),
          ...(isPendingDay && {
            backgroundColor: "orange",
            color: "white",
            "&:hover": {
              backgroundColor: "darkorange",
            },
          }),
        }}
      />
    );
  };

  return (
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            Calendar View
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
              disablePast={false}
              slots={{
                day: CustomDay,
              }}
            />
          </LocalizationProvider>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default CalendarView;