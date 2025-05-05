import { render, screen, fireEvent } from '@testing-library/react'
import LandingPage from '@/LandingPage';// Update path accordingly
import { MemoryRouter } from 'react-router-dom'

// Mock framer-motion to avoid animation errors
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    img: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
    button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  },
  useScroll: () => ({ scrollYProgress: { current: 0 } }),
}))

// Mock media assets
jest.mock('@/assets/media', () => ({
  mediaAssets: {
    droneVideo: 'mock-video.mp4',
    facilityImage: 'facility.jpg',
    eventImage: 'event.jpg',
    maintenanceImage: 'maintenance.jpg',
    communityImage2: 'community2.jpg',
  },
}))

// Mock useTheme hook
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    mode: 'light',
    toggleTheme: jest.fn(),
  }),
}))

describe('LandingPage Component', () => {
  it('renders hero section with heading and call-to-action buttons', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/manage your community/i)).toBeInTheDocument()
    expect(screen.getByText(/experience the vibrant life/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('displays feature cards with correct titles and descriptions', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const features = [
      { title: 'Manage Facilities', description: 'Easily manage your facilities with our intuitive interface and real-time availability.' },
      { title: 'Book Events', description: 'Schedule and book your events effortlessly with our calendar integration.' },
      { title: 'Maintenance Requests', description: 'Request facility maintenance with ease and track progress in real-time.' },
    ]

    features.forEach((feature) => {
      expect(screen.getByText(feature.title)).toBeInTheDocument()
      expect(screen.getByText(feature.description)).toBeInTheDocument()
    })
  })

  it('renders video background with correct source', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const video = screen.getByTestId('drone-video')
    expect(video).toHaveAttribute('src', 'mock-video.mp4')
    expect(video).toHaveAttribute('type', 'video/mp4')
  })

  it('applies dark mode when theme is toggled', () => {
    const toggleThemeMock = jest.fn()
    jest.spyOn(require('@/contexts/ThemeContext'), 'useTheme').mockReturnValue({
      mode: 'dark',
      toggleTheme: toggleThemeMock,
    })

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const overlay = screen.getByTestId('dark-overlay')
    expect(overlay).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0.8)' })
  })

  it('toggles theme on click', () => {
    const toggleThemeMock = jest.fn()
    jest.spyOn(require('@/contexts/ThemeContext'), 'useTheme').mockReturnValue({
      mode: 'light',
      toggleTheme: toggleThemeMock,
    })

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const themeToggle = screen.getByLabelText(/toggle theme/i)
    fireEvent.click(themeToggle)

    expect(toggleThemeMock).toHaveBeenCalled()
  })

  it('navigates to login on "Login" button click', () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /login/i }))
    expect(navigateMock).toHaveBeenCalledWith('/login')
  })

  it('navigates to login on "Sign Up" button click', () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(navigateMock).toHaveBeenCalledWith('/login')
  })

  it('displays scroll indicator at bottom of hero section', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const scrollIndicator = screen.getByTestId('scroll-indicator')
    expect(scrollIndicator).toBeInTheDocument()
    expect(scrollIndicator).toHaveTextContent('Scroll Down')
  })

  it('renders parallax sections correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const parallaxSection = screen.getByTestId('parallax-section')
    expect(parallaxSection).toBeInTheDocument()
    expect(parallaxSection).toHaveTextContent('Amazing Features')
  })

  it('displays all feature cards', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    expect(featureCards.length).toBe(3)

    const titles = ['Manage Facilities', 'Book Events', 'Maintenance Requests']
    titles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument()
    })
  })

  it('renders feature card images correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const images = screen.getAllByTestId('feature-image')
    expect(images[0]).toHaveAttribute('src', 'facility.jpg')
    expect(images[1]).toHaveAttribute('src', 'event.jpg')
    expect(images[2]).toHaveAttribute('src', 'maintenance.jpg')
  })

  it('shows testimonials/community showcase', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/community showcase/i)).toBeInTheDocument()
    expect(screen.getByText(/amazing features/i)).toBeInTheDocument()
  })

  it('renders video background with overlay', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const videoOverlay = screen.getByTestId('dark-overlay')
    expect(videoOverlay).toBeInTheDocument()
    expect(videoOverlay).toHaveStyle({ zIndex: '1' })
  })

  it('applies correct styles to feature cards on hover', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    expect(featureCards.length).toBeGreaterThan(0)

    // We simulate hover by checking if transform style exists
    const firstCard = featureCards[0]
    expect(firstCard).toHaveStyle({ transition: 'transform 0.5s' })
  })

  it('renders testimonial section with placeholder image', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const testimonialImage = screen.getByAltText(/community showcase/i)
    expect(testimonialImage).toBeInTheDocument()
    expect(testimonialImage).toHaveAttribute('src', 'community2.jpg')
  })

  it('displays footer-like scroll prompt', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const scrollPrompt = screen.getByTestId('scroll-prompt')
    expect(scrollPrompt).toBeInTheDocument()
    expect(scrollPrompt).toHaveTextContent('Scroll Down')
  })

  it('renders CTA section with sign-up and login buttons', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('applies correct spacing and layout classes', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureGrid = screen.getByTestId('feature-grid')
    expect(featureGrid).toHaveStyle({ display: 'flex' })
    expect(featureGrid).toHaveStyle({ gap: '4px' }) // From `gap: 4` in sx prop
  })

  it('uses responsive layout for feature cards', () => {
    // Mock mobile viewport
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 600px)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureGrid = screen.getByTestId('feature-grid')
    expect(featureGrid).toHaveStyle({ flexDirection: 'column' })
  })

  it('renders theme toggle icon in top-right corner', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const themeToggle = screen.getByLabelText(/toggle theme/i)
    expect(themeToggle).toBeInTheDocument()
    expect(themeToggle).toHaveStyle({ position: 'fixed' })
    expect(themeToggle).toHaveStyle({ top: '16px' })
    expect(themeToggle).toHaveStyle({ right: '16px' })
  })

  it('displays animated heading and subheading', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/manage your community/i)).toBeInTheDocument()
    expect(screen.getByText(/experience the vibrant life/i)).toBeInTheDocument()
  })

  it('has accessible labels for interactive elements', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows loading state while fetching data', () => {
    // If your LandingPage has conditional rendering based on loading state
    // You can mock that here
  })

  it('handles theme toggle without error', () => {
    const toggleThemeMock = jest.fn()
    jest.spyOn(require('@/contexts/ThemeContext'), 'useTheme').mockReturnValue({
      mode: 'light',
      toggleTheme: toggleThemeMock,
    })

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const themeToggle = screen.getByLabelText(/toggle theme/i)
    fireEvent.click(themeToggle)

    expect(toggleThemeMock).toHaveBeenCalled()
  })

  it('renders all feature icons correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const icons = screen.getAllByTestId('feature-icon')
    expect(icons.length).toBe(3)
  })

  it('renders feature paths as expected', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureLinks = screen.getAllByTestId('feature-link')
    expect(featureLinks.length).toBe(3)

    expect(featureLinks[0]).toHaveAttribute('href', '/facilities')
    expect(featureLinks[1]).toHaveAttribute('href', '/bookings')
    expect(featureLinks[2]).toHaveAttribute('href', '/maintenance')
  })

  it('displays feature cards with correct paths', () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureLinks = screen.getAllByTestId('feature-link')
    fireEvent.click(featureLinks[0])

    expect(navigateMock).toHaveBeenCalledWith('/facilities')
  })

  it('renders feature cards with hover animations', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    expect(featureCards.length).toBe(3)

    // Check if transform scale is applied on hover (simulated through style checks)
    const firstCard = featureCards[0]
    expect(firstCard).toHaveStyle({ transition: 'transform 0.5s' })
  })

  it('displays video poster or fallback image', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const videoPoster = screen.getByTestId('video-poster')
    expect(videoPoster).toBeInTheDocument()
    expect(videoPoster).toHaveStyle({ objectFit: 'cover' })
  })

  it('displays feature descriptions correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const descriptions = [
      'Easily manage your facilities with our intuitive interface and real-time availability.',
      'Schedule and book your events effortlessly with our calendar integration.',
      'Request facility maintenance with ease and track progress in real-time.',
    ]

    descriptions.forEach((desc) => {
      expect(screen.getByText(desc)).toBeInTheDocument()
    })
  })

  it('displays correct number of feature cards', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    expect(featureCards.length).toBe(3)
  })

  it('renders feature images with correct object-fit behavior', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const images = screen.getAllByTestId('feature-image')
    images.forEach((img) => {
      expect(img).toHaveStyle({ objectFit: 'cover' })
    })
  })

  it('displays feature card buttons correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const buttons = screen.getAllByTestId('feature-button')
    expect(buttons.length).toBe(3)
  })

  it('renders feature card links correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const links = screen.getAllByTestId('feature-link')
    expect(links.length).toBe(3)
  })

  it('shows theme toggle icon', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const themeIcon = screen.getByLabelText(/toggle theme/i)
    expect(themeIcon).toBeInTheDocument()
  })

  it('displays correct text alignment and styling', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const heading = screen.getByText(/manage your community/i)
    expect(heading).toHaveStyle({ textAlign: 'center' })
    expect(heading).toHaveStyle({ fontWeight: 'bold' })
  })

  it('displays correct typography colors', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const heading = screen.getByText(/manage your community/i)
    expect(heading).toHaveStyle({ color: 'rgb(255, 255, 255)' }) // white text over video
  })

  it('renders feature cards with consistent sizing', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ width: '300px' })
      expect(card).toHaveStyle({ height: '200px' })
    })
  })

  it('renders feature cards with hover effect', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    const firstCard = featureCards[0]

    // Simulate hover effect
    fireEvent.mouseOver(firstCard)
    expect(firstCard).toHaveStyle({ transform: 'scale(1.05)' })
  })

  it('renders feature cards with consistent border radius and shadow', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ borderRadius: '8px' })
      expect(card).toHaveStyle({ boxShadow: '6' })
    })
  })

  it('renders testimonials section with default message', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/everything you need to manage/i)).toBeInTheDocument()
  })

  it('displays feature icons correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const icons = screen.getAllByTestId('feature-icon')
    expect(icons.length).toBe(3)
  })

  it('renders video background with fallback content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const video = screen.getByTestId('drone-video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveProperty('tagName', 'VIDEO')
  })

  it('renders video with autoplay and muted attributes', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const video = screen.getByTestId('drone-video')
    expect(video).toHaveAttribute('autoPlay')
    expect(video).toHaveAttribute('muted')
  })

  it('renders fixed-position theme toggle', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const themeToggle = screen.getByLabelText(/toggle theme/i)
    expect(themeToggle).toHaveStyle({ position: 'fixed' })
    expect(themeToggle).toHaveStyle({ top: '16px' })
    expect(themeToggle).toHaveStyle({ right: '16px' })
  })

  it('renders scroll indicator at bottom of hero section', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const scrollIndicator = screen.getByTestId('scroll-indicator')
    expect(scrollIndicator).toBeInTheDocument()
    expect(scrollIndicator).toHaveStyle({ bottom: '40px' })
  })

  it('renders feature cards with descriptive text', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureDescriptions = screen.getAllByTestId('feature-description')
    expect(featureDescriptions.length).toBe(3)
  })

  it('displays feature cards with centered content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureContents = screen.getAllByTestId('feature-content')
    featureContents.forEach((content) => {
      expect(content).toHaveStyle({ display: 'flex' })
      expect(content).toHaveStyle({ justifyContent: 'center' })
      expect(content).toHaveStyle({ alignItems: 'center' })
    })
  })

  it('displays correct feature card images', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const images = screen.getAllByTestId('feature-image')
    expect(images[0]).toHaveAttribute('src', 'facility.jpg')
    expect(images[1]).toHaveAttribute('src', 'event.jpg')
    expect(images[2]).toHaveAttribute('src', 'maintenance.jpg')
  })

  it('renders feature cards with hover scale effect', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    expect(featureCards.length).toBe(3)

    // Simulate hover
    fireEvent.mouseOver(featureCards[0])
    expect(featureCards[0]).toHaveStyle({ transform: 'scale(1.05)' })
  })

  it('renders testimonials section with community image', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const communityImage = screen.getByAltText(/community showcase/i)
    expect(communityImage).toBeInTheDocument()
    expect(communityImage).toHaveAttribute('src', 'community2.jpg')
  })

  it('renders testimonial section with correct styling', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const testimonialSection = screen.getByTestId('testimonial-section')
    expect(testimonialSection).toBeInTheDocument()
    expect(testimonialSection).toHaveStyle({ padding: '24px' })
  })

  it('renders feature card links correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureLinks = screen.getAllByTestId('feature-link')
    expect(featureLinks.length).toBe(3)
  })

  it('renders feature card images with hover zoom effect', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const images = screen.getAllByTestId('feature-image')
    expect(images[0]).toHaveStyle({ transition: 'transform 0.5s' })
  })

  it('displays feature card link paths correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureLinks = screen.getAllByTestId('feature-link')
    expect(featureLinks[0]).toHaveAttribute('href', '/facilities')
    expect(featureLinks[1]).toHaveAttribute('href', '/bookings')
    expect(featureLinks[2]).toHaveAttribute('href', '/maintenance')
  })

  it('renders feature card images with correct aspect ratio', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const images = screen.getAllByTestId('feature-image')
    images.forEach((img) => {
      expect(img).toHaveStyle({ width: '100%' })
      expect(img).toHaveStyle({ height: '100%' })
    })
  })

  it('renders feature cards with hover animation', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    expect(featureCards[0]).toHaveStyle({ transition: 'transform 0.5s' })
  })

  it('renders feature cards with consistent box-shadow', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ boxShadow: '6' })
    })
  })

  it('renders feature cards with rounded corners', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ borderRadius: '8px' })
    })
  })

  it('renders testimonial section with appropriate max-width', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const testimonialSection = screen.getByTestId('testimonial-section')
    expect(testimonialSection).toHaveStyle({ maxWidth: '800px' })
  })

  it('renders testimonial section with centered text', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const testimonialSection = screen.getByTestId('testimonial-section')
    expect(testimonialSection).toHaveStyle({ textAlign: 'center' })
  })

  it('renders feature cards with internal spacing', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ mb: '24px' })
    })
  })

  it('renders feature cards with proper gap between them', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureGrid = screen.getByTestId('feature-grid')
    expect(featureGrid).toHaveStyle({ gap: '4px' })
  })

  it('renders feature cards with hover effect', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    expect(featureCards[0]).toHaveStyle({ transform: 'scale(1.05)' })
  })

  it('renders feature cards with consistent size', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    expect(featureCards[0]).toHaveStyle({ width: '300px' })
    expect(featureCards[0]).toHaveStyle({ height: '200px' })
  })

  it('renders feature cards with overflow hidden', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ overflow: 'hidden' })
    })
  })

  it('renders feature cards with inner content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureContents = screen.getAllByTestId('feature-content')
    expect(featureContents.length).toBe(3)
  })

  it('renders feature cards with inner text', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Manage Facilities')).toBeInTheDocument()
    expect(screen.getByText('Book Events')).toBeInTheDocument()
    expect(screen.getByText('Maintenance Requests')).toBeInTheDocument()
  })

  it('renders feature cards with secondary text', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/intuitive interface/i)).toBeInTheDocument()
    expect(screen.getByText(/calendar integration/i)).toBeInTheDocument()
    expect(screen.getByText(/track progress/i)).toBeInTheDocument()
  })

  it('renders feature card images with smooth transitions', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const images = screen.getAllByTestId('feature-image')
    images.forEach((img) => {
      expect(img).toHaveStyle({ transition: 'transform 0.5s' })
    })
  })

  it('renders feature cards with hover effect', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    fireEvent.mouseOver(featureCards[0])
    expect(featureCards[0]).toHaveStyle({ transform: 'scale(1.05)' })
  })

  it('renders feature cards with consistent margin-bottom', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ marginBottom: '24px' })
    })
  })

  it('renders feature cards with internal flexbox', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    expect(featureCards[0]).toHaveStyle({ display: 'flex' })
    expect(featureCards[0]).toHaveStyle({ justifyContent: 'center' })
    expect(featureCards[0]).toHaveStyle({ alignItems: 'center' })
  })

  it('renders feature card icons', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const icons = screen.getAllByTestId('feature-icon')
    expect(icons.length).toBe(3)
  })

  it('renders feature cards with consistent styling', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ boxShadow: '6' })
      expect(card).toHaveStyle({ borderRadius: '8px' })
    })
  })

  it('renders feature cards with image scaling on hover', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const images = screen.getAllByTestId('feature-image')
    fireEvent.mouseOver(images[0])
    expect(images[0]).toHaveStyle({ transform: 'scale(1.05)' })
  })

  it('renders feature cards with internal spacing', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ p: '1.5' })
    })
  })

  it('renders testimonial section with descriptive text', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/everything you need to manage/i)).toBeInTheDocument()
    expect(screen.getByText(/community facilities/i)).toBeInTheDocument()
  })

  it('renders testimonial section with centered alignment', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const testimonialSection = screen.getByTestId('testimonial-section')
    expect(testimonialSection).toHaveStyle({ textAlign: 'center' })
  })

  it('renders feature cards with hover animation on tap', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    fireEvent.click(featureCards[0])
    expect(featureCards[0]).toHaveStyle({ transform: 'scale(0.95)' })
  })

  it('renders testimonial section with max-width constraint', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const testimonialSection = screen.getByTestId('testimonial-section')
    expect(testimonialSection).toHaveStyle({ maxWidth: '800px' })
  })

  it('renders feature cards with internal padding', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ px: '4' })
      expect(card).toHaveStyle({ py: '1.5' })
    })
  })

  it('renders feature cards with internal spacing and margins', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ mb: '24px' })
    })
  })

  it('renders feature cards with image container', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const imageContainers = screen.getAllByTestId('feature-image-container')
    expect(imageContainers.length).toBe(3)
  })

  it('renders feature cards with image stretch', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const images = screen.getAllByTestId('feature-image')
    images.forEach((img) => {
      expect(img).toHaveStyle({ width: '100%' })
      expect(img).toHaveStyle({ height: '100%' })
    })
  })

  it('renders feature cards with consistent structure', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ width: '300px' })
      expect(card).toHaveStyle({ height: '200px' })
    })
  })

  it('renders feature cards with correct image paths', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const images = screen.getAllByTestId('feature-image')
    expect(images[0]).toHaveAttribute('src', 'facility.jpg')
    expect(images[1]).toHaveAttribute('src', 'event.jpg')
    expect(images[2]).toHaveAttribute('src', 'maintenance.jpg')
  })

  it('renders testimonial section with centered alignment', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const testimonialSection = screen.getByTestId('testimonial-section')
    expect(testimonialSection).toHaveStyle({ mx: 'auto' })
  })

  it('renders testimonial section with maximum width constraint', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const testimonialSection = screen.getByTestId('testimonial-section')
    expect(testimonialSection).toHaveStyle({ maxWidth: '800px' })
  })

      it('renders testimonial section with centered heading', () => {
          render(
          <MemoryRouter>
              <LandingPage />
          </MemoryRouter>
          )
      
          const heading = screen.getByTestId('feature-heading')
          expect(heading).toHaveStyle({ textAlign: 'center' })
      });
  });

  it('renders testimonial section with centered subheading', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const subheading = screen.getByTestId('feature-subheading')
    expect(subheading).toHaveStyle({ textAlign: 'center' })
  })

  it('renders feature cards with consistent margin', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ mr: '24px' })
    })
  })

  it('renders feature cards with internal spacing and padding', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ px: '4' })
      expect(card).toHaveStyle({ py: '1.5' })
    })
  })

  it('renders feature cards with consistent box shadows', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const featureCards = screen.getAllByTestId('feature-card')
    featureCards.forEach((card) => {
      expect(card).toHaveStyle({ boxShadow: '6' })
    })
  })

  it('renders testimonial section with centered text', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const testimonialSection = screen.getByTestId('testimonial-section')
    expect(testimonialSection).toHaveStyle({ textAlign: 'center' })
  })

  it('renders testimonial section with centered buttons', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )

    const ctaButtons = screen.getAllByTestId('cta-button')
    expect(ctaButtons.length).toBe(2)
  })

    it('renders testimonial section with centered heading', () => {
        render(
        <MemoryRouter>
            <LandingPage />
        </MemoryRouter>
        )
    
        const heading = screen.getByTestId('feature-heading')
        expect(heading).toHaveStyle({ textAlign: 'center' })
    })