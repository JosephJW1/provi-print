import React from 'react';

const UsersPage: React.FC = () => {
  // You will need a backend route (e.g. GET /users) protected by isAdmin to populate this.

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-neutral-100">User Management</h1>
        <p className="text-slate-500 dark:text-neutral-400">Manage customers and admin roles.</p>
      </div>

      <div className="bg-yellow-50 dark:bg-neutral-900 border border-yellow-200 dark:border-yellow-700/50 p-4 rounded-lg text-yellow-800 dark:text-yellow-300">
        <p className="font-semibold">Backend Endpoint Required</p>
        <p className="text-sm mt-1 text-yellow-700 dark:text-neutral-400">
          Create a GET /users route on the server to populate the DataTable here.
        </p>
      </div>
    </div>
  );
};

export default UsersPage;