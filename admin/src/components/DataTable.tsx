export interface Column<T> {
  key: keyof T;
  label: string;
}

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  addLabel?: string;
}

export function DataTable<T extends { id: number | string }>({
  title,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  addLabel = "Add New"
}: DataTableProps<T>) {
  return (
    <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-lg border border-slate-200 dark:border-neutral-800 transition-colors">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-slate-50 dark:bg-neutral-800/60 rounded-t-lg">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-neutral-100">{title}</h2>
        {onAdd && (
          <button
            onClick={onAdd}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-neutral-200 dark:hover:bg-white dark:text-neutral-900 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            + {addLabel}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-neutral-800/40 text-slate-600 dark:text-neutral-400 text-sm border-b border-slate-200 dark:border-neutral-800">
              {columns.map((col) => (
                <th key={String(col.key)} className="px-6 py-3 font-medium">
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && <th className="px-6 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-slate-500 dark:text-neutral-500">
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-6 py-4 text-sm text-slate-700 dark:text-neutral-300">
                      {String(item[col.key] || '')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 text-sm text-right space-x-3">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-600 hover:text-blue-800 dark:text-neutral-200 dark:hover:text-white font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}