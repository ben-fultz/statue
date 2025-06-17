// Site Configuration
// This file contains your site's general settings
// You can manage email addresses, social media links, and other contact information from here

export const siteConfig = {
  // Site general information
  site: {
    name: "Statue SSG",
    description: "A simple static site generator for markdown content with SvelteKit",
    url: "https://statuessg.com",
    author: "Statue Team"
  },

  // Theme Configuration
  // Choose from: 'dark-green', 'dark-blue', 'dark-purple', 'light', 'ocean', 'sunset'
  theme: {
    preset: 'dark-green', // Current theme preset
    
    // Available theme presets
    presets: {
      'dark-green': {
        name: 'Dark Green (Default)',
        colors: {
          background: 'bg-black',
          surface: 'bg-gray-900',
          primary: 'text-green-500',
          primaryBg: 'bg-green-500',
          primaryHover: 'hover:bg-green-600',
          secondary: 'text-amber-400',
          text: 'text-white',
          textMuted: 'text-gray-300',
          textSubtle: 'text-gray-400',
          border: 'border-gray-800'
        }
      },
      'dark-blue': {
        name: 'Dark Blue',
        colors: {
          background: 'bg-slate-900',
          surface: 'bg-slate-800',
          primary: 'text-blue-400',
          primaryBg: 'bg-blue-500',
          primaryHover: 'hover:bg-blue-600',
          secondary: 'text-cyan-400',
          text: 'text-white',
          textMuted: 'text-slate-300',
          textSubtle: 'text-slate-400',
          border: 'border-slate-700'
        }
      },
      'dark-purple': {
        name: 'Dark Purple',
        colors: {
          background: 'bg-gray-900',
          surface: 'bg-gray-800',
          primary: 'text-purple-400',
          primaryBg: 'bg-purple-500',
          primaryHover: 'hover:bg-purple-600',
          secondary: 'text-pink-400',
          text: 'text-white',
          textMuted: 'text-gray-300',
          textSubtle: 'text-gray-400',
          border: 'border-gray-700'
        }
      },
      'light': {
        name: 'Light Theme',
        colors: {
          background: 'bg-white',
          surface: 'bg-gray-50',
          primary: 'text-blue-600',
          primaryBg: 'bg-blue-600',
          primaryHover: 'hover:bg-blue-700',
          secondary: 'text-indigo-600',
          text: 'text-gray-900',
          textMuted: 'text-gray-700',
          textSubtle: 'text-gray-500',
          border: 'border-gray-200'
        }
      },
      'ocean': {
        name: 'Ocean Theme',
        colors: {
          background: 'bg-slate-900',
          surface: 'bg-slate-800',
          primary: 'text-teal-400',
          primaryBg: 'bg-teal-500',
          primaryHover: 'hover:bg-teal-600',
          secondary: 'text-emerald-400',
          text: 'text-white',
          textMuted: 'text-slate-300',
          textSubtle: 'text-slate-400',
          border: 'border-slate-600'
        }
      },
      'sunset': {
        name: 'Sunset Theme',
        colors: {
          background: 'bg-orange-950',
          surface: 'bg-orange-900',
          primary: 'text-orange-400',
          primaryBg: 'bg-orange-500',
          primaryHover: 'hover:bg-orange-600',
          secondary: 'text-yellow-400',
          text: 'text-white',
          textMuted: 'text-orange-200',
          textSubtle: 'text-orange-300',
          border: 'border-orange-800'
        }
      }
    }
  },

  // Contact information
  contact: {
    // Main contact email
    email: "your-email@example.com",
    
    // Privacy policy related email
    privacyEmail: "your-privacy@example.com",
    
    // Support email
    supportEmail: "your-support@example.com",
    
    // Phone number (optional)
    phone: "+1 (555) 123-4567",
    
    // Mailing address
    address: {
      street: "123 Statue Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94103",
      country: "United States"
    }
  },

  // Social media links
  social: {
    twitter: "https://twitter.com/statuessg",
    github: "https://github.com/accretional/statue",
    linkedin: "https://linkedin.com/company/statuessg",
    facebook: "https://facebook.com/statuessg",
    instagram: "https://instagram.com/statuessg",
    youtube: "https://youtube.com/@statuessg"
  },

  // Legal pages specific settings
  legal: {
    // Privacy policy last updated date
    privacyPolicyLastUpdated: "2024-01-15",
    
    // Terms of use last updated date
    termsLastUpdated: "2024-01-15",
    
    // CCPA/CPRA compliance for California state
    isCaliforniaCompliant: true,
    
    // Do Not Sell page additional information
    doNotSell: {
      processingTime: "15 business days",
      confirmationRequired: true
    }
  },

  // SEO and meta information
  seo: {
    defaultTitle: "Statue SSG - Static Site Generator",
    titleTemplate: "%s | Statue SSG",
    defaultDescription: "A simple static site generator for markdown content with SvelteKit",
    keywords: ["static site generator", "markdown", "sveltekit", "ssg"],
    ogImage: "/images/og-image.png",
    twitterCard: "summary_large_image"
  }
};

// Export configuration
export default siteConfig; 
