// src/components/ModalAgregarDocente.jsx (corregido: removida autenticación Google)
import React from 'react';
import { FiX } from 'react-icons/fi';
import DocenteForm from './DocenteForm';

const ModalAgregarDocente = ({ isOpen, onClose, onSubmit, formData, onChange, setFormData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
      <div className="modal-bg p-8 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Agregar Docente</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1"
          >
            <FiX size={24} />
          </button>
        </div>
        <DocenteForm
          onSubmit={onSubmit}
          formData={formData}
          onChange={onChange}
          setFormData={setFormData}
        />
      </div>
    </div>
  );
};

export default ModalAgregarDocente;