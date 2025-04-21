import React from "react";

export const Card = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      {children}
    </div>
  );
};

export const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

export const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl font-bold text-blue-800">{children}</h2>
);

export const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);
