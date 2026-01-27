import React, { useEffect } from 'react';
import { SidebarProvider as BaseSidebarProvider, SidebarProviderProps } from '@/components/ui/sidebar';
import { useConfig } from '@/hooks/use-config';

type EnhancedSidebarProviderProps = SidebarProviderProps & {
  children: React.ReactNode;
};

export const SidebarProvider: React.FC<EnhancedSidebarProviderProps> = ({
  defaultOpen = true,
  children,
  onOpenChange,
  ...props
}) => {
  const { config, updateSidebarCollapsed } = useConfig();

  // Determine the initial open state based on our config
  // If no config exists, use the default
  const initialOpenState = config.sidebar.collapsed === undefined
    ? defaultOpen
    : !config.sidebar.collapsed;

  // Sync our config with the actual sidebar state when it changes
  const handleOpenChange = (isOpen: boolean) => {
    // Update our config when sidebar state changes
    // If isOpen is true, sidebar is expanded, so collapsed is false
    // If isOpen is false, sidebar is collapsed, so collapsed is true
    updateSidebarCollapsed(!isOpen);

    // Call the original onOpenChange if provided
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  };

  return (
    <BaseSidebarProvider
      defaultOpen={initialOpenState}
      onOpenChange={handleOpenChange}
      {...props}
    >
      {children}
    </BaseSidebarProvider>
  );
};