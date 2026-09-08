import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const SIDEBAR_COOKIE_NAME = 'sidebar:state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = '256px'
const SIDEBAR_WIDTH_MOBILE = '280px'
const SIDEBAR_WIDTH_ICON = '56px'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

export const SidebarContext = createContext(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }
  return context
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className = '',
  style = {},
  children,
  ...props
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [openMobile, setOpenMobile] = useState(false)

  // Internal state if uncontrolled
  const [_open, _setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COOKIE_NAME)
      if (saved !== null) {
        return saved === 'true'
      }
    } catch {
      // Ignore localStorage error
    }
    return defaultOpen
  })

  const open = openProp !== undefined ? openProp : _open
  const setOpen = useCallback(
    (value) => {
      const openState = typeof value === 'function' ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      try {
        localStorage.setItem(SIDEBAR_COOKIE_NAME, String(openState))
      } catch {
        // Ignore localStorage error
      }
    },
    [setOpenProp, open]
  )

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Toggle helper
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev)
    } else {
      setOpen((prev) => !prev)
    }
  }, [isMobile, setOpen])

  // Keyboard shortcut Ctrl+B / Cmd+B
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  const state = open ? 'expanded' : 'collapsed'

  const contextValue = useMemo(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        data-state={state}
        style={{
          '--sidebar-width': SIDEBAR_WIDTH,
          '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
          ...style,
        }}
        className={`sidebar-wrapper ${className}`}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'icon',
  className = '',
  children,
  ...props
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        data-variant={variant}
        data-side={side}
        className={`sidebar ${className}`}
        {...props}
      >
        <div className="sidebar-inner">{children}</div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        {openMobile && (
          <div
            className="sidebar-mobile-backdrop"
            onClick={() => setOpenMobile(false)}
            aria-hidden="true"
          />
        )}
        <aside
          data-slot="sidebar"
          data-mobile="true"
          data-state={openMobile ? 'open' : 'closed'}
          data-side={side}
          className={`sidebar-mobile ${className}`}
          {...props}
        >
          <div className="sidebar-inner">{children}</div>
        </aside>
      </>
    )
  }

  return (
    <aside
      data-slot="sidebar"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      className={`sidebar ${className}`}
      {...props}
    >
      <div className="sidebar-inner">{children}</div>
    </aside>
  )
}

export function SidebarHeader({ className = '', children, ...props }) {
  return (
    <header
      data-slot="sidebar-header"
      className={`sidebar-header ${className}`}
      {...props}
    >
      {children}
    </header>
  )
}

export function SidebarContent({ className = '', children, ...props }) {
  return (
    <div
      data-slot="sidebar-content"
      className={`sidebar-content ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarGroup({ className = '', children, ...props }) {
  return (
    <div
      data-slot="sidebar-group"
      className={`sidebar-group ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarGroupLabel({ className = '', children, ...props }) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={`sidebar-group-label ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarGroupContent({ className = '', children, ...props }) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={`sidebar-group-content ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarMenu({ className = '', children, ...props }) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={`sidebar-menu ${className}`}
      {...props}
    >
      {children}
    </ul>
  )
}

export function SidebarMenuItem({ className = '', children, ...props }) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={`sidebar-menu-item ${className}`}
      {...props}
    >
      {children}
    </li>
  )
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className = '',
  children,
  onClick,
  ...props
}) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const buttonProps = {
    'data-slot': 'sidebar-menu-button',
    'data-active': isActive,
    'data-size': size,
    'data-variant': variant,
    title: isCollapsed && tooltip ? tooltip : undefined,
    className: `sidebar-menu-button ${className}`,
    onClick,
    ...props,
  }

  return (
    <button type="button" {...buttonProps}>
      {children}
    </button>
  )
}

export function SidebarMenuBadge({ className = '', children, ...props }) {
  return (
    <span
      data-slot="sidebar-menu-badge"
      className={`sidebar-menu-badge ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export function SidebarFooter({ className = '', children, ...props }) {
  return (
    <footer
      data-slot="sidebar-footer"
      className={`sidebar-footer ${className}`}
      {...props}
    >
      {children}
    </footer>
  )
}

export function SidebarRail({ className = '', ...props }) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar (Ctrl+B)"
      className={`sidebar-rail ${className}`}
      {...props}
    />
  )
}

export function SidebarTrigger({ className = '', onClick, ...props }) {
  const { toggleSidebar, state } = useSidebar()

  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      aria-label="Toggle Sidebar"
      onClick={(e) => {
        onClick?.(e)
        toggleSidebar()
      }}
      title={`Toggle Sidebar (${state === 'expanded' ? 'Collapse' : 'Expand'} Ctrl+B)`}
      className={`sidebar-trigger ${className}`}
      {...props}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sidebar-trigger-icon"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
      </svg>
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}
