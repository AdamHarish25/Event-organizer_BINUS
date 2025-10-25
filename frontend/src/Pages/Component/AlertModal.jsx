import React from "react";
const AlertModal = ({ open, title, message, variant = "info", onClose }) => {
  if (!open) return null;
  const color = variant === "error" ? "bg-red-500" : variant === "warning" ? "bg-yellow-500" : "bg-blue-500";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-2 text-white ${color}`}></div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 ml-4">Close</button>
        </div>
      </div>
    </div>
  );
};
export default AlertModal;