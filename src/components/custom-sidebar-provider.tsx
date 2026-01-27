import React, { useState, useEffect, useRef } from 'react';
import { SidebarProvider as BaseSidebarProvider, SidebarProviderProps } from '@/components/ui/sidebar';
import { useConfig } from '@/hooks/use-config';

type CustomSidebarProviderProps = SidebarProviderProps & {
  children: React.ReactNode;
};

export const CustomSidebarProvider: React.FC<CustomSidebarProviderProps> = ({
  defaultOpen = true,
  children,
  ...props
}) => {
  const { config, updateSidebarCollapsed } = useConfig();
  const isUpdatingFromConfig = useRef(false); // Prevent circular updates

  // Use local state that we fully control
  const [open, setOpen] = useState<boolean>(() => {
    // Initialize from config, fallback to default
    return config.sidebar.collapsed === undefined
      ? defaultOpen
      : !config.sidebar.collapsed;
  });

  // Update local state when config changes (from other tabs/windows or initial load)
  // but only if the change didn't originate from this component
  useEffect(() => {
    if (isUpdatingFromConfig.current) {
      isUpdatingFromConfig.current = false; // Reset the flag
      return; // Skip if we just updated the config
    }

    const newOpenState = config.sidebar.collapsed === undefined
      ? defaultOpen
      : !config.sidebar.collapsed;

    if (newOpenState !== open) {
      setOpen(newOpenState);
    }
  }, [config.sidebar.collapsed, defaultOpen, open]);

  // Update config when local state changes
  const updateConfigFromState = (newOpen: boolean) => {
    isUpdatingFromConfig.current = true; // Set flag to prevent circular update
    const isCollapsed = !newOpen;
    updateSidebarCollapsed(isCollapsed);
  };

  // Handle sidebar toggle
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    updateConfigFromState(newOpen);
  };

  return (
    <BaseSidebarProvider
      open={open}
      onOpenChange={handleOpenChange}
      {...props}
    >
      {children}
    </BaseSidebarProvider>
  );
};