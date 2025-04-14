"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { jwtDecode } from "jwt-decode"
import { useNavigate } from "react-router-dom"
import { api } from "@/services/api"

interface User {
  id: number
  type: string
  name?: string
  email?: string
  picture?: string
}

interface DecodedToken {
  id: number
  iat: number
  exp: number
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
  checkAuth: () => void
  setAuthData: (token: string, userData: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  const setAuthData = useCallback((token: string, userData: User) => {
    // Sanitize user data to avoid circular structure errors
    const sanitizedUser: User = {
      id: userData.id,
      type: userData.type,
      name: userData.name,
      email: userData.email,
      picture: userData.picture,
    }

    console.log("Setting Auth Data - token:", token)
    console.log("Sanitized User Data:", sanitizedUser)

    try {
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(sanitizedUser))

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(sanitizedUser)
      setIsAuthenticated(true)
      setLoading(false)
    } catch (err) {
      console.error("Failed to store auth data:", err)
    }
  }, [])

  const checkAuth = useCallback(() => {
    setLoading(true)

    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (!token || !storedUser) {
      setIsAuthenticated(false)
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token)
      const currentTime = Date.now() / 1000

      if (decoded.exp < currentTime) {
        // Token expired
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setIsAuthenticated(false)
        setUser(null)
        setLoading(false)
        return
      }

      // Token valid
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Invalid token", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setIsAuthenticated(false)
      setUser(null)
    }

    setLoading(false)
  }, [])

  const login = useCallback(() => {
    //@ts-ignore
    const apiUrl = import.meta.env.VITE_API_URL || "/api/v1"
    const redirectUri = `${window.location.origin}/auth/callback`
    window.location.href = `${apiUrl}/auth/google?redirect_uri=${encodeURIComponent(
      redirectUri
    )}`
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    delete api.defaults.headers.common["Authorization"]
    setIsAuthenticated(false)
    setUser(null)
    navigate("/login")
  }, [navigate])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        checkAuth,
        setAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
