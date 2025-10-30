// src/components/ModalEditarDocente.jsx
import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import DocenteForm from './DocenteForm';

const ModalEditarDocente = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onChange, 
  setFormData, 
  docente, 
  title = 'Editar Perfil', 
  subtitle = 'Modifica tus datos personales' 
}) => {
  // Efecto: Inicializar formData con datos del docente
  useEffect(() => {
    if (docente && isOpen) {
      // Separar usuario y dominio del correo personal si viene como string
      let correoPersonalUser = '';
      let correoPersonalDomain = 'gmail.com';
      if (docente.correoPersonal) {
        const partes = docente.correoPersonal.split('@');
        correoPersonalUser = partes[0] || '';
        correoPersonalDomain = partes[1] || 'gmail.com';
      } else {
        correoPersonalUser = docente.correoPersonalUser || '';
        correoPersonalDomain = docente.correoPersonalDomain || 'gmail.com';
      }

      setFormData({
        nombre: docente.nombre || '',
        fechaNacimiento: docente.fechaNacimiento || '',
        dni: docente.dni || '',
        celular: docente.celular || '',
        correoPersonalUser,
        correoPersonalDomain,
        // Solo la parte del usuario, sin @uss.edu.pe
        correoInstitucional: docente.correoInstitucional ? docente.correoInstitucional.replace(/@uss\.edu\.pe$/, '') : '',
        direccion: docente.direccion || '',
        fotoBase64: '',
        foto: docente.foto || '',
        descripcion: docente.descripcion || '',
        gradoAcademico: docente.gradoAcademico || '',
        magisterEn: docente.magisterEn || '',
        doctoradoEn: docente.doctoradoEn || '',
        genero: docente.genero || '',
        cursosDictados: Array.isArray(docente.cursosDictados) ? docente.cursosDictados : [],
        horariosDisponibles: docente.horariosDisponibles || ''
      });
    }
  }, [docente, isOpen, setFormData, formData?.nombre]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    if (e.target.name === 'cursosDictados') {
      setFormData({ ...formData, cursosDictados: e.target.value });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // 👉 Aquí se hace el "early return" de JSX
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center text-white">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
            <p className="text-xs sm:text-sm opacity-90 mt-1">{subtitle}</p>
            {docente?.nombre && (
              <p className="text-xs opacity-80 mt-1">Editando: {docente.nombre}</p>
            )}
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
            onChange={handleInputChange}
            buttonText="Actualizar Perfil"
            setFormData={setFormData}
            isEdit={true}
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
