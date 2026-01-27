import { useState, useEffect } from 'react';

// Define the structure of our configuration
interface ConfigState {
  sidebar: {
    collapsed: boolean;
  };
  adminTables: {
    reflections: {
      sortConfig: {
        key: string;
        direction: 'ascending' | 'descending';
      };
      visibleColumns: string[];
    };
    users: {
      sortConfig: {
        key: string;
        direction: 'ascending' | 'descending';
      };
      visibleColumns: string[];
    };
  };
  // Add more configuration sections as needed
  [key: string]: any;
}

// Default configuration values
const DEFAULT_CONFIG: ConfigState = {
  sidebar: {
    collapsed: false,
  },
  adminTables: {
    reflections: {
      sortConfig: {
        key: 'Date',
        direction: 'descending',
      },
      visibleColumns: ['First Name', 'Last Name', 'JSD Number', 'Date', 'Barometer'],
    },
    users: {
      sortConfig: {
        key: 'Zoom Name',
        direction: 'ascending',
      },
      visibleColumns: ['Zoom Name', 'Project Group', 'Genmate Group', 'First Name', 'Last Name', 'JSD Number', 'Email', 'Cohort', 'Total Reflections', 'Last Barometer'],
    },
  },
};

// Configuration key for localStorage
const CONFIG_STORAGE_KEY = 'baro-app-config';

/**
 * Custom hook for managing application configuration
 */
export const useConfig = () => {
  const [config, setConfig] = useState<ConfigState>(() => {
    // Try to load config from localStorage
    try {
      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (storedConfig) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
      }
    } catch (error) {
      console.error('Failed to parse stored config:', error);
    }
    
    // Return default config if none found or parsing failed
    return DEFAULT_CONFIG;
  });

  // Save config to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }, [config]);

  /**
   * Updates a specific part of the configuration
   */
  const updateConfig = (updateFn: (prevConfig: ConfigState) => Partial<ConfigState>) => {
    setConfig(prevConfig => {
      const updates = updateFn(prevConfig);
      return { ...prevConfig, ...updates };
    });
  };

  /**
   * Updates the sidebar collapsed state
   */
  const updateSidebarCollapsed = (collapsed: boolean) => {
    updateConfig(prev => ({
      sidebar: {
        ...prev.sidebar,
        collapsed
      }
    }));
  };

  /**
   * Updates sorting configuration for admin reflections table
   */
  const updateAdminReflectionsSort = (key: string, direction: 'ascending' | 'descending') => {
    updateConfig(prev => ({
      adminTables: {
        ...prev.adminTables,
        reflections: {
          ...prev.adminTables.reflections,
          sortConfig: {
            key,
            direction
          }
        }
      }
    }));
  };

  /**
   * Updates visible columns for admin reflections table
   */
  const updateAdminReflectionsVisibleColumns = (columns: string[]) => {
    updateConfig(prev => ({
      adminTables: {
        ...prev.adminTables,
        reflections: {
          ...prev.adminTables.reflections,
          visibleColumns: columns
        }
      }
    }));
  };

  /**
   * Updates sorting configuration for admin users table
   */
  const updateAdminUsersSort = (key: string, direction: 'ascending' | 'descending') => {
    updateConfig(prev => ({
      adminTables: {
        ...prev.adminTables,
        users: {
          ...prev.adminTables.users,
          sortConfig: {
            key,
            direction
          }
        }
      }
    }));
  };

  /**
   * Updates visible columns for admin users table
   */
  const updateAdminUsersVisibleColumns = (columns: string[]) => {
    updateConfig(prev => ({
      adminTables: {
        ...prev.adminTables,
        users: {
          ...prev.adminTables.users,
          visibleColumns: columns
        }
      }
    }));
  };

  return {
    config,
    updateConfig,
    updateSidebarCollapsed,
    updateAdminReflectionsSort,
    updateAdminReflectionsVisibleColumns,
    updateAdminUsersSort,
    updateAdminUsersVisibleColumns,
  };
};