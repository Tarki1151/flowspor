import React from "react";

export default function Table({ columns, data, rowKey, actions, ariaLabel }) {
  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full bg-white dark:bg-gray-800" aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-4 py-2">İşlemler</th>}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr
              key={row[rowKey]}
              className="hover:bg-blue-50 dark:hover:bg-gray-700 focus-within:bg-blue-100"
              tabIndex={0}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className="px-4 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap"
                >
                  {row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-2 flex gap-2">
                  {actions.map(action => (
                    <button
                      key={action.label}
                      aria-label={action.ariaLabel || action.label}
                      onClick={() => action.onClick(row)}
                      className={action.className}
                    >
                      {action.icon}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
