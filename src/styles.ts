import { definePreset } from '@primeng/themes'
import Aura from '@primeng/themes/aura'

/** Institutional Portal — paleta federal / académica (Siepa). Base: Aura. */
export const InstitutionalPortal = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '0.125rem',
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    navy: {
      50: '#e6eef6',
      100: '#c5d8ec',
      200: '#9ebfdd',
      300: '#78a6ce',
      400: '#4e8bc0',
      500: '#276199',
      600: '#004b82',
      700: '#00345d',
      800: '#002544',
      900: '#00172f',
      950: '#000c18'
    },
    forest: {
      50: '#e8f8ed',
      100: '#c5edd1',
      200: '#9ef6b3',
      300: '#83d998',
      400: '#5cc981',
      500: '#0d6d38',
      600: '#0a5c30',
      700: '#084d28',
      800: '#063d20',
      900: '#042918',
      950: '#02150c'
    }
  },
  semantic: {
    primary: {
      50: '{navy.50}',
      100: '{navy.100}',
      200: '{navy.200}',
      300: '{navy.300}',
      400: '{navy.400}',
      500: '{navy.500}',
      600: '{navy.600}',
      700: '{navy.700}',
      800: '{navy.800}',
      900: '{navy.900}',
      950: '{navy.950}'
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{navy.500}',
      offset: '2px'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{navy.600}',
          inverseColor: '#ffffff',
          hoverColor: '{navy.700}',
          activeColor: '{navy.800}'
        },
        highlight: {
          background: '#d2e4ff',
          focusBackground: '#a0caff',
          color: '{navy.700}',
          focusColor: '{navy.800}'
        },
        surface: {
          0: '#fbf9f8',
          50: '#f6f3f2',
          100: '#f0eded',
          200: '#eae7e7',
          300: '#e4e2e1',
          400: '#dcd9d9',
          500: '#c2c7d1',
          600: '#727781',
          700: '#565c64',
          800: '#424750',
          900: '#2f2f2f',
          950: '#1b1c1c'
        }
      },
      dark: {
        primary: {
          color: '#89bcfa',
          inverseColor: '{navy.700}',
          hoverColor: '#a0caff',
          activeColor: '#d2e4ff'
        },
        highlight: {
          background: 'rgba(137, 188, 250, 0.14)',
          focusBackground: 'rgba(137, 188, 250, 0.22)',
          color: '#f3f0f0',
          focusColor: '#ffffff'
        },
        surface: {
          0: '#1b1c1c',
          50: '#242424',
          100: '#303030',
          200: '#3a3a3a',
          300: '#454545',
          400: '#525252',
          500: '#727781',
          600: '#8a9099',
          700: '#c2c7d1',
          800: '#e4e2e1',
          900: '#f0eded',
          950: '#fbf9f8'
        }
      }
    }
  },
  components: {
    toast: {
      root: {
        width: 'min(22rem, calc(100vw - 2rem))',
        borderRadius: '0.5rem'
      },
      icon: { size: '1.125rem' },
      content: { padding: '0.875rem 1rem 0.875rem 0.95rem', gap: '0.75rem' },
      text: { gap: '0.1875rem' },
      summary: {
        fontWeight: '600',
        fontSize: '0.875rem'
      },
      detail: {
        fontWeight: '400',
        fontSize: '0.8125rem'
      },
      closeButton: {
        width: '2rem',
        height: '2rem',
        borderRadius: '0.25rem',
        focusRing: {
          width: '{focus.ring.width}',
          style: '{focus.ring.style}',
          offset: '{focus.ring.offset}'
        }
      },
      closeIcon: { size: '0.875rem' },
      colorScheme: {
        light: {
          blur: '8px',
          info: {
            background: '#ffffff',
            borderColor: '#c2c7d1',
            color: '#1b1c1c',
            detailColor: '#424750',
            shadow: '0 1px 0 rgba(27, 28, 28, 0.06)',
            closeButton: {
              hoverBackground: 'rgba(27, 28, 28, 0.06)',
              focusRing: {
                color: '{navy.500}',
                shadow: '0 0 0 2px rgba(39, 97, 153, 0.25)'
              }
            }
          },
          success: {
            background: '#ffffff',
            borderColor: '#c2c7d1',
            color: '#1b1c1c',
            detailColor: '#18733d',
            shadow: '0 1px 0 rgba(27, 28, 28, 0.06)',
            closeButton: {
              hoverBackground: 'rgba(27, 28, 28, 0.06)',
              focusRing: {
                color: '{forest.500}',
                shadow: '0 0 0 2px rgba(13, 109, 56, 0.22)'
              }
            }
          },
          warn: {
            background: '#ffffff',
            borderColor: '#c2c7d1',
            color: '#1b1c1c',
            detailColor: '#565c64',
            shadow: '0 1px 0 rgba(27, 28, 28, 0.06)',
            closeButton: {
              hoverBackground: 'rgba(27, 28, 28, 0.06)',
              focusRing: {
                color: '#727781',
                shadow: '0 0 0 2px rgba(114, 119, 129, 0.25)'
              }
            }
          },
          error: {
            background: '#ffffff',
            borderColor: '#c2c7d1',
            color: '#1b1c1c',
            detailColor: '#93000a',
            shadow: '0 1px 0 rgba(27, 28, 28, 0.06)',
            closeButton: {
              hoverBackground: 'rgba(27, 28, 28, 0.06)',
              focusRing: {
                color: '#ba1a1a',
                shadow: '0 0 0 2px rgba(186, 26, 26, 0.22)'
              }
            }
          },
          secondary: {
            background: '#ffffff',
            borderColor: '#c2c7d1',
            color: '#1b1c1c',
            detailColor: '#424750',
            shadow: '0 1px 0 rgba(27, 28, 28, 0.05)',
            closeButton: {
              hoverBackground: 'rgba(27, 28, 28, 0.06)',
              focusRing: {
                color: '#727781',
                shadow: '0 0 0 2px rgba(114, 119, 129, 0.2)'
              }
            }
          },
          contrast: {
            background: '#00345d',
            borderColor: '#004b82',
            color: '#ffffff',
            detailColor: '#d2e4ff',
            shadow: 'none',
            closeButton: {
              hoverBackground: 'rgba(255, 255, 255, 0.1)',
              focusRing: {
                color: '#ffffff',
                shadow: '0 0 0 2px rgba(255, 255, 255, 0.25)'
              }
            }
          }
        },
        dark: {
          blur: '10px',
          info: {
            background: '#303030',
            borderColor: '#525252',
            color: '#f3f0f0',
            detailColor: '#c2c7d1',
            shadow: 'none',
            closeButton: {
              hoverBackground: 'rgba(255, 255, 255, 0.08)',
              focusRing: {
                color: '#89bcfa',
                shadow: '0 0 0 2px rgba(137, 188, 250, 0.35)'
              }
            }
          },
          success: {
            background: '#303030',
            borderColor: '#525252',
            color: '#f3f0f0',
            detailColor: '#9ef6b3',
            shadow: 'none',
            closeButton: {
              hoverBackground: 'rgba(255, 255, 255, 0.08)',
              focusRing: {
                color: '#83d998',
                shadow: '0 0 0 2px rgba(131, 217, 152, 0.28)'
              }
            }
          },
          warn: {
            background: '#303030',
            borderColor: '#525252',
            color: '#f3f0f0',
            detailColor: '#eae7e7',
            shadow: 'none',
            closeButton: {
              hoverBackground: 'rgba(255, 255, 255, 0.08)',
              focusRing: {
                color: '#c2c7d1',
                shadow: '0 0 0 2px rgba(194, 199, 209, 0.25)'
              }
            }
          },
          error: {
            background: '#303030',
            borderColor: '#525252',
            color: '#f3f0f0',
            detailColor: '#ffdad6',
            shadow: 'none',
            closeButton: {
              hoverBackground: 'rgba(255, 255, 255, 0.08)',
              focusRing: {
                color: '#ffb4ab',
                shadow: '0 0 0 2px rgba(255, 180, 171, 0.3)'
              }
            }
          },
          secondary: {
            background: '#2a2a2a',
            borderColor: '#454545',
            color: '#e4e2e1',
            detailColor: '#c2c7d1',
            shadow: 'none',
            closeButton: {
              hoverBackground: 'rgba(255, 255, 255, 0.06)',
              focusRing: {
                color: '#a1a1aa',
                shadow: '0 0 0 2px rgba(161, 161, 170, 0.3)'
              }
            }
          },
          contrast: {
            background: '#fbf9f8',
            borderColor: '#e4e2e1',
            color: '#1b1c1c',
            detailColor: '#424750',
            shadow: 'none',
            closeButton: {
              hoverBackground: 'rgba(27, 28, 28, 0.06)',
              focusRing: {
                color: '#00345d',
                shadow: '0 0 0 2px rgba(0, 52, 93, 0.2)'
              }
            }
          }
        }
      }
    }
  }
})
