import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { DataTable, type Column } from '../components/DataTable';

interface Town {
  id: number;
  townName: string;
  latitude: number;
  longitude: number;
}

const TownsPage: React.FC = () => {
  const [towns, setTowns] = useState<Town[]>([]);

  useEffect(() => {
    api.get('/towns').then((res) => setTowns(res.data)).catch(console.error);
  }, []);

  const columns: Column<Town>[] = [
    { key: 'id', label: 'ID' },
    { key: 'townName', label: 'Town Name' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-neutral-100">Towns Database</h1>
        <p className="text-slate-500 dark:text-neutral-400">
          Read-only view of established coordinates.
        </p>
      </div>

      <DataTable
        title="Active Towns"
        data={towns}
        columns={columns}
      />
    </div>
  );
};

export default TownsPage;