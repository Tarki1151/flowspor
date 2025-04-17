import React from "react";
import Table from "./Table";

export default function MemberList({ members, onEdit, onDelete }) {
  const columns = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "membership_type", label: "Type" },
    { key: "status", label: "Status" },
  ];

  const actions = [
    {
      label: "Edit",
      icon: <span role="img" aria-label="Edit">✏️</span>,
      ariaLabel: "Edit Member",
      className:
        "p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 focus:outline-none",
      onClick: onEdit,
    },
    {
      label: "Delete",
      icon: <span role="img" aria-label="Delete">🗑️</span>,
      ariaLabel: "Delete Member",
      className:
        "p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-300 focus:outline-none",
      onClick: onDelete,
    },
  ];

  return (
    <div className="p-2 md:p-6">
      <Table
        columns={columns}
        data={members}
        rowKey="id"
        actions={actions}
        ariaLabel="Member List"
      />
    </div>
  );
}
