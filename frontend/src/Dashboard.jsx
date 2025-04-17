import React from "react";
import Card from "./Card";
import Table from "./Table";

// Demo data for stats and recent registrations
function Dashboard({ stats, recentRegistrations }) {
  // Example stats: [{title: 'Active Members', value: 120, icon: '💪'}, ...]
  // Example recentRegistrations: [{id, name, email, date}, ...]
  const statItems = stats || [
    { title: "Active Members", value: 120, icon: "💪" },
    { title: "Classes Today", value: 6, icon: "📅" },
    { title: "Trainers", value: 4, icon: "🏋️" },
    { title: "Revenue", value: "$2,500", icon: "💵" },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "date", label: "Date" },
  ];
  const data = recentRegistrations || [
    { id: 1, name: "Ali Kaya", email: "ali@example.com", date: "2025-04-15" },
    { id: 2, name: "Ayşe Demir", email: "ayse@example.com", date: "2025-04-16" },
  ];

  return (
    <div className="p-2 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {statItems.map((s) => (
          <Card key={s.title} title={s.title} value={s.value} icon={s.icon} />
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Recent Registrations</h3>
        <Table columns={columns} data={data} rowKey="id" ariaLabel="Recent Registrations" />
      </div>
    </div>
  );
}

export default Dashboard;
