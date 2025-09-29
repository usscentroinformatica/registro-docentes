// src/components/ModalEditarDocente.jsx (actualizado: responsive)
import React from 'react';
import { FiX } from 'react-icons/fi';
import DocenteForm from './DocenteForm';

const ModalEditarDocente = ({ isOpen, onClose, onSubmit, formData, onChange, setFormData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center text-white">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold">Editar Perfil</h3>
            <p className="text-xs sm:text-sm opacity-90 mt-1">Modifica tus datos personales</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
          >
            <FiX size={14} className="sm:size-14" />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-4 sm:p-6">
          <DocenteForm
            onSubmit={onSubmit}
            formData={formData}
            onChange={onChange}
            buttonText="Actualizar Perfil"
            setFormData={setFormData}
          />
        </div>
        
        {/* Footer */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-gray-400 transition-all duration-200 text-sm sm:text-base"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarDocente;