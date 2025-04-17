import React, { useEffect, useRef } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  const modalRef = useRef();

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md outline-none"
        tabIndex={0}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl focus:outline-none"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
