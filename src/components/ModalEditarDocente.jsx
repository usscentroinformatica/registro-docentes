// src/components/ModalEditarDocente.jsx (corregido para mejor estructura)
import React from 'react';
import { FiX } from 'react-icons/fi';
import DocenteForm from './DocenteForm';

const ModalEditarDocente = ({ isOpen, onClose, onSubmit, formData, onChange, setFormData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header del modal */}
        <div className="bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h3 className="text-xl font-bold">Editar Perfil</h3>
            <p className="text-sm opacity-90 mt-1">Modifica tus datos personales</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-6">
          <DocenteForm
            onSubmit={onSubmit}
            formData={formData}
            onChange={onChange}
            buttonText="Actualizar Perfil"
            setFormData={setFormData}
          />
        </div>
        
        {/* Footer con cancelar */}
        <div className="px-6 pb-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarDocente;