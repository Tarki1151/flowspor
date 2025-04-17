import React from "react";

export default function Card({ title, value, icon, ariaLabel }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={ariaLabel || title}
      tabIndex={0}
    >
      <div className="text-3xl mr-4" aria-hidden="true">{icon}</div>
      <div>
        <div className="text-gray-700 dark:text-gray-100 text-lg font-semibold">{title}</div>
        <div className="text-blue-600 dark:text-blue-300 text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}
