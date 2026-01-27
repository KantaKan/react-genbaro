import React from 'react';
import { useConfig } from '../hooks/use-config';

const ConfigTestComponent: React.FC = () => {
  const { config, updateSidebarCollapsed, updateAdminReflectionsSort, updateAdminUsersSort } = useConfig();

  const handleTestSidebar = () => {
    updateSidebarCollapsed(!config.sidebar.collapsed);
  };

  const handleTestReflectionSort = () => {
    updateAdminReflectionsSort('FirstName', config.adminTables.reflections.sortConfig.direction === 'ascending' ? 'descending' : 'ascending');
  };

  const handleTestUserSort = () => {
    updateAdminUsersSort('First Name', config.adminTables.users.sortConfig.direction === 'ascending' ? 'descending' : 'ascending');
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 m-4">
      <h3 className="text-lg font-semibold mb-2">Configuration Test Component</h3>
      
      <div className="mb-4">
        <p><strong>Sidebar Collapsed:</strong> {config.sidebar.collapsed ? 'Yes' : 'No'}</p>
        <button 
          onClick={handleTestSidebar}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Sidebar State
        </button>
      </div>
      
      <div className="mb-4">
        <p><strong>Reflections Sort Key:</strong> {config.adminTables.reflections.sortConfig.key}</p>
        <p><strong>Reflections Sort Direction:</strong> {config.adminTables.reflections.sortConfig.direction}</p>
        <button 
          onClick={handleTestReflectionSort}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Toggle Reflections Sort
        </button>
      </div>
      
      <div>
        <p><strong>Users Sort Key:</strong> {config.adminTables.users.sortConfig.key}</p>
        <p><strong>Users Sort Direction:</strong> {config.adminTables.users.sortConfig.direction}</p>
        <button 
          onClick={handleTestUserSort}
          className="mt-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Toggle Users Sort
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-100 rounded">
        <h4 className="font-medium mb-1">Current Config (for debugging):</h4>
        <pre className="text-xs overflow-auto max-w-full bg-white p-2 rounded">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ConfigTestComponent;