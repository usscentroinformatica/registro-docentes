// src/components/ModalDocente.jsx
import React from 'react';
import { FiX } from 'react-icons/fi';

const ModalDocente = ({ docente, onClose }) => {
  if (!docente) return null;

  // Función para calcular edad dinámicamente
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

  const edad = calcularEdad(docente.fechaNacimiento);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-slate-100 p-10 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Perfil del Docente</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda: Datos (con edad nueva) */}
          <div className="space-y-6">
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
              <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 font-medium">{edad}</p>
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
          {/* Columna derecha: Foto más arriba */}
          <div className="flex items-start justify-center">
            <div className="text-center">
              <img
                src={docente.foto}
                alt={docente.nombre}
                className="w-80 h-80 object-cover rounded-xl shadow-md border border-gray-200 mx-auto"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/320x320?text=Sin+Foto';
                }}
              />
              <p className="text-sm text-gray-500 mt-3 font-medium">Foto de perfil</p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-8 w-full btn-primary py-3"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ModalDocente;