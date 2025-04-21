"use client"

import { useEffect, useState, useRef } from "react"
import { Box, Typography, Button, useMediaQuery, useTheme as useMuiTheme, CircularProgress, Container } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/contexts/ThemeContext"
import LightModeIcon from "@mui/icons-material/LightMode"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Parallax } from "react-parallax"
//import { is } from "date-fns/locale"
useScroll;useTransform;
// Video and image URLs from Vercel Blob storage
const mediaAssets = {
  droneVideo: "https://pcgyhzbplxptutua.public.blob.vercel-storage.com/drone-bg-PbQBL5xKwWRW6JKLqwtr8VqqUJG4eC.mp4",
  communityImage1: "https://pcgyhzbplxptutua.public.blob.vercel-storage.com/1-2TQKnG3iqmLKNptyM4B2dCpI2hxTJ7.jpg",
  communityImage2: "https://pcgyhzbplxptutua.public.blob.vercel-storage.com/istockphoto-1088536252-612x612-yFTYKjlPAR0lL92wqFEGFbVpfVkVsf.jpg",
  facilityImage: "https://pcgyhzbplxptutua.public.blob.vercel-storage.com/multi-sport-GxSQni0Gu7z1ewfL25ADg0Ifq7RDz2.jpg",
  eventImage: "https://pcgyhzbplxptutua.public.blob.vercel-storage.com/579b97bd-39b7-4fa4-8362-fa9908188aa1-Lj1goETL0I8JZnoxFmVjwuG4OKB0sb.jpeg",
  maintenanceImage: "https://pcgyhzbplxptutua.public.blob.vercel-storage.com/depositphotos_109789362-stock-photo-worker-in-uniform-holding-tools-gq7RpaXaT4dGXpnaWK3ZRNWlofLxsG.jpg"
}

const LandingPage = () => {
  const navigate = useNavigate()
  const muiTheme = useMuiTheme()
  const { mode, toggleTheme } = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const featuresRef = useRef(null)
  const isInView = useInView(featuresRef, { once: true, margin: "-100px" }) // Added margin to trigger animation earlier
  //const { scrollYProgress } = useScroll()
 // const y = useTransform(scrollYProgress, [0, 1], [0, -200])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      navigate('/dashboard')
    } else {
      setCheckingAuth(false)
    }
isScrolled;isInView;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [navigate])

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  if (checkingAuth) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ overflowX: "hidden", bgcolor: mode === "dark" ? "background.default" : "background.paper" }}>
      {/* Hero Section with Video Background */}
      <Box sx={{ position: "relative", height: "100vh", width: "100%", overflow: "hidden" }}>
        <Box
          component="video"
          autoPlay
          loop
          muted
          playsInline
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
            opacity: mode === "dark" ? 0.8 : 0.9,
          }}
        >
          <source src={mediaAssets.droneVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </Box>

        {/* Dark overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 1,
          }}
        />

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            cursor: "pointer",
            zIndex: 1000,
          }}
          onClick={toggleTheme}
          whileHover={{ scale: 1.1 }}
        >
          {mode === "dark" ? (
            <LightModeIcon sx={{ fontSize: 30, color: "#fff" }} />
          ) : (
            <DarkModeIcon sx={{ fontSize: 30, color: "#fff" }} />
          )}
        </motion.div>

        {/* Hero Content */}
        <Container
          sx={{
            position: "relative",
            zIndex: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant={isMobile ? "h3" : "h1"}
              component="h1"
              sx={{
                fontWeight: "bold",
                mb: 2,
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                fontSize: isMobile ? "2.5rem" : "4rem",
              }}
            >
              Welcome to <span style={{ color: mode === "dark" ? "#4CAF50" : "#2E7D32" }}>iReserve</span>
            </Typography>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{
                mb: 4,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                maxWidth: "800px",
              }}
            >
              Discover the perfect way to manage and reserve facilities, book events, and connect with your beautiful community.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => handleNavigate("/login")}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                  }}
                >
                  Sign Up
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => handleNavigate("/login")}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    borderWidth: "2px",
                    "&:hover": { borderWidth: "2px" },
                  }}
                >
                  Login
                </Button>
              </motion.div>
            </Box>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <Typography variant="body2" sx={{ color: "#fff", mb: 1 }}>
              Scroll Down
            </Typography>
            <Box
              sx={{
                width: "24px",
                height: "40px",
                border: "2px solid #fff",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "center",
                paddingTop: "6px",
              }}
            >
              <Box
                sx={{
                  width: "4px",
                  height: "8px",
                  backgroundColor: "#fff",
                  borderRadius: "2px",
                }}
              />
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Community Showcase Section */}
      <Parallax 
        strength={300} 
        bgImage={mediaAssets.communityImage1}
        style={{
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <Box sx={{ py: 10, backgroundColor: "rgba(0,0,0,0.7)" }}>
          <Container>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontWeight: "bold",
                  mb: 4,
                  textAlign: "center",
                  color: "#fff",
                }}
              >
                Our Beautiful Community
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 6,
                  textAlign: "center",
                  color: "rgba(255,255,255,0.9)",
                  maxWidth: "800px",
                  mx: "auto",
                }}
              >
                Experience the vibrant life and amenities that make our community special.
              </Typography>
            </motion.div>

            <Box
              sx={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                justifyContent: "center",
                mt: 6,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Box
                  sx={{
                    width: 300,
                    height: 200,
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: 6,
                  }}
                >
                  <Box
                    component="img"
                    src={mediaAssets.communityImage2}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  />
                </Box>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Box
                  sx={{
                    width: 300,
                    height: 200,
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: 6,
                  }}
                >
                  <Box
                    component="img"
                    src={mediaAssets.facilityImage}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  />
                </Box>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Box
                  sx={{
                    width: 300,
                    height: 200,
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: 6,
                  }}
                >
                  <Box
                    component="img"
                    src={mediaAssets.eventImage}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  />
                </Box>
              </motion.div>
            </Box>
          </Container>
        </Box>
      </Parallax>

      {/* Features Section - Fixed visibility issue */}
      <Box
        ref={featuresRef}
        sx={{
          py: 10,
          bgcolor: mode === "dark" ? "background.default" : "background.paper",
          position: "relative",
        }}
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: "bold",
                mb: 2,
                textAlign: "center",
                color: "text.primary",
              }}
            >
              Amazing Features
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                mb: 6,
                textAlign: "center",
                maxWidth: "800px",
                mx: "auto",
              }}
            >
              Everything you need to manage your community facilities
            </Typography>
          </motion.div>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
              mt: 5,
              flexDirection: isMobile ? "column" : "row",
              gap: 4,
            }}
          >
            {[
              {
                title: "Manage Facilities",
                description: "Easily manage your facilities with our intuitive interface and real-time availability.",
                image: mediaAssets.facilityImage,
                path: "/facilities"
              },
              {
                title: "Book Events",
                description: "Schedule and book your events effortlessly with our calendar integration.",
                image: mediaAssets.eventImage,
                path: "/bookings"
              },
              {
                title: "Maintenance Requests",
                description: "Request facility maintenance with ease and track progress in real-time.",
                image: mediaAssets.maintenanceImage,
                path: "/maintenance"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Box
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderRadius: 2,
                    height: "100%",
                    boxShadow: 2,
                    transition: "all 0.3s ease",
                    bgcolor: mode === "dark" ? "background.paper" : "background.default",
                    "&:hover": {
                      transform: "translateY(-10px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "200px",
                      mb: 3,
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      src={feature.image}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, color: "text.primary" }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
                    {feature.description}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => handleNavigate(feature.path)}
                    sx={{
                      px: 4,
                      fontWeight: "bold",
                    }}
                  >
                    Explore
                  </Button>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: 10, bgcolor: mode === "dark" ? "background.default" : "background.paper" }}>
        <Container>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: "bold",
              mb: 6,
              textAlign: "center",
              color: "text.primary",
            }}
          >
            What Our Residents Say
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[
              {
                quote: "iReserve has completely transformed how we manage our community facilities. So easy to use!",
                author: "Sarah Johnson",
                role: "Community Board Member",
              },
              {
                quote: "Booking events has never been simpler. The interface is intuitive and the system is reliable.",
                author: "Michael Chen",
                role: "Event Coordinator",
              },
              {
                quote: "The maintenance request feature saved us so much time. Issues get resolved twice as fast now.",
                author: "David Wilson",
                role: "Facility Manager",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    maxWidth: "360px",
                    bgcolor: mode === "dark" ? "background.paper" : "background.default",
                    boxShadow: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 3, fontStyle: "italic", color: "text.primary" }}>
                    "{testimonial.quote}"
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "text.primary" }}>
                    {testimonial.author}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testimonial.role}
                  </Typography>
                  <Box sx={{ display: "flex", mt: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <Box key={i} sx={{ color: "#FFD700", fontSize: "1.2rem" }}>
                        ★
                      </Box>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

     {/* CTA Section - Theme Adjusted */}
<Box sx={{ 
  py: 10, 
  bgcolor: mode === "dark" ? "background.paper" : "primary.main",
  color: mode === "dark" ? "text.primary" : "#fff"
}}>
  <Container>
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <Typography
        variant="h3"
        component="h2"
        sx={{
          fontWeight: "bold",
          mb: 3,
          textAlign: "center",
        }}
      >
        Ready to Get Started?
      </Typography>
      <Typography
        variant="h6"
        sx={{
          mb: 6,
          textAlign: "center",
          maxWidth: "800px",
          mx: "auto",
          opacity: mode === "dark" ? 0.9 : 1
        }}
      >
        Join our community today and experience the best in facility management.
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 3 }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="contained"
            color={mode === "dark" ? "primary" : "secondary"}
            size="large"
            onClick={() => handleNavigate("/login")}
            sx={{
              px: 6,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "bold",
            }}
          >
            Sign Up Now
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={mode === "dark" ? "outlined" : "contained"}
            color={mode === "dark" ? "inherit" : "primary"}
            size="large"
            onClick={() => handleNavigate("/login")}
            sx={{
              px: 6,
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "bold",
              borderWidth: "2px",
              "&:hover": { borderWidth: "2px" },
              ...(mode === "dark" ? {} : { bgcolor: "primary.dark" })
            }}
          >
            Login
          </Button>
        </motion.div>
      </Box>
    </motion.div>
  </Container>
</Box>

      {/* Footer */}
      <Box 
        component="footer"
        sx={{ 
          py: 4,
          bgcolor: mode === "dark" ? "background.paper" : "background.default",
          borderTop: `1px solid ${mode === "dark" ? "#333" : "#e0e0e0"}`,
        }}
      >
        <Container>
          <Typography 
            variant="body1" 
            align="center"
            sx={{ color: "text.secondary" }}
          >
            © {new Date().getFullYear()} iReserve. All rights reserved.
          </Typography>
          <Typography 
            variant="body2" 
            align="center"
            sx={{ mt: 1, color: "text.secondary" }}
          >
            Designed with ❤️ for your community
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPage