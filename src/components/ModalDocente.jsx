// src/components/ModalDocente.jsx (actualizado: responsive)
import React from 'react';
import { FiX, FiDownload } from 'react-icons/fi';

const ModalDocente = ({ docente, onClose }) => {
  if (!docente) return null;

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No especificada';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad > 0 ? `${edad} años` : 'Edad no válida';
  };

  const handleDownload = () => {
    if (docente.foto && docente.foto !== 'https://via.placeholder.com/320x320?text=Sin+Foto') {
      const link = document.createElement('a');
      link.href = docente.foto;
      link.download = `foto_${docente.nombre.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No hay imagen disponible para descargar.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center text-white">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold">Detalles del Docente</h3>
            <p className="text-xs sm:text-sm opacity-90 mt-1">{docente.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
          >
            <FiX size={12} className="sm:size-12" />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Nombre completo</label>
                <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">{docente.nombre}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Fecha de nacimiento</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.fechaNacimiento || 'No especificada'}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Edad</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 font-medium">
                  {calcularEdad(docente.fechaNacimiento)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">DNI</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.dni || 'No especificado'}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Número de celular</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.celular || 'No especificado'}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Correo personal</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.correoPersonal || 'No especificado'}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Correo institucional</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.correoInstitucional || 'No especificado'}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Dirección</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.direccion || 'No especificada'}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Descripción</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">{docente.descripcion}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Cursos dictados en USS</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">{docente.cursosDictados || 'No especificados'}</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <img
  src={docente.foto || 'https://via.placeholder.com/320x320?text=Sin+Foto'}
  alt={docente.nombre}
  className="w-48 h-48 sm:w-80 sm:h-80 object-contain bg-gray-50 rounded-xl shadow-md border border-gray-200"
  onError={(e) => {
    e.target.src = 'https://via.placeholder.com/320x320?text=Sin+Foto';
  }}
/>

                <p className="text-sm text-gray-500 mt-3 font-medium">Foto de perfil</p>
                {/* Botón descargar imagen */}
{docente.foto && docente.foto !== 'https://via.placeholder.com/320x320?text=Sin+Foto' && (
  <button
    onClick={handleDownload}
    className="mt-2 flex items-center space-x-2 px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs sm:text-sm font-medium"
  >
    <FiDownload size={12} /> {/* tamaño reducido */}
    <span>Descargar</span>
  </button>
)}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDocente;