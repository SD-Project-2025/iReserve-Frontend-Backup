/**
 * Development utilities for testing different parts of the application
 * These functions are only available in development mode
 */

/**
 * Set the user type for testing different dashboards
 * @param type The user type to set ('resident', 'staff', or 'admin')
 */
export const setTestUserType = (type: "resident" | "staff" | "admin") => {
  if (import.meta.env.DEV) {
    const user = JSON.parse(localStorage.getItem("user") || "{}")

    if (type === "admin") {
      // For admin, we set the user type to staff and a flag for admin privileges
      user.type = "staff"
      localStorage.setItem("testAdminDashboard", "true")
    } else {
      user.type = type
      localStorage.removeItem("testAdminDashboard")
    }

    localStorage.setItem("user", JSON.stringify(user))
    console.log(`DEV MODE: User type set to ${type}`)

    // Reload the page to apply changes
    window.location.reload()
  } else {
    console.warn("This function is only available in development mode")
  }
}

/**
 * Reset all development testing settings
 */
export const resetDevSettings = () => {
  if (import.meta.env.DEV) {
    localStorage.removeItem("testAdminDashboard")
    console.log("DEV MODE: Development settings reset")
  }
}
