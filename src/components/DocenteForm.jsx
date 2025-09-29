// src/components/DocenteForm.jsx (actualizado: sin zoom en preview)
import React, { useState } from 'react';
import { FiCamera } from 'react-icons/fi';

const DocenteForm = ({ onSubmit, formData, onChange, buttonText = 'Guardar Docente', setFormData }) => {
  const [fotoBase64, setFotoBase64] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBase64(reader.result);
        onChange({ target: { name: 'fotoBase64', value: reader.result } });
      };
      reader.readAsDataURL(file);
    } else {
      alert('Solo JPG o PNG permitidos.');
    }
  };

  // Limpiar foto preview al cerrar (opcional, pero útil)
  React.useEffect(() => {
    return () => setFotoBase64('');
  }, [setFormData]);

  const previewSrc = fotoBase64 || formData.foto;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Sección de datos personales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo *</label>
          <input
            type="text"
            name="nombre"
            placeholder="Ej: Juan Pérez"
            value={formData.nombre || ''}
            onChange={onChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de nacimiento</label>
          <input
            type="date"
            name="fechaNacimiento"
            value={formData.fechaNacimiento || ''}
            onChange={onChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
          <input
            type="text"
            name="dni"
            placeholder="Ej: 12345678"
            value={formData.dni || ''}
            onChange={onChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            maxLength="8"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Número de celular</label>
          <input
            type="tel"
            name="celular"
            placeholder="Ej: +51 999 123 456"
            value={formData.celular || ''}
            onChange={onChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Correo personal *</label>
          <input
            type="email"
            name="correoPersonal"
            placeholder="Ej: juan@gmail.com"
            value={formData.correoPersonal || ''}
            onChange={onChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Correo institucional</label>
          <input
            type="email"
            name="correoInstitucional"
            placeholder="Ej: juan@uss.edu.pe"
            value={formData.correoInstitucional || ''}
            onChange={onChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
        <input
          type="text"
          name="direccion"
          placeholder="Ej: Av. Principal 123, Lima"
          value={formData.direccion || ''}
          onChange={onChange}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Foto de perfil - sin zoom, muestra tal como se sube */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
          <FiCamera size={16} />
          <span>Foto de perfil (opcional)</span>
        </label>
        <input
          type="file"
          name="fotoBase64"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {previewSrc && (
          <div className="mt-3 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <img 
              src={previewSrc} 
              alt="Vista previa" 
              className="w-32 h-32 object-contain rounded-xl shadow-md border border-gray-200 flex-shrink-0 bg-white p-2" // Cambiado a object-contain y p-2 para fondo blanco
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Vista previa</p>
              <p className="text-xs text-gray-500">La nueva foto reemplazará la actual al guardar.</p>
            </div>
          </div>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
        <textarea
          name="descripcion"
          placeholder="Breve bio, materias impartidas, experiencia..."
          value={formData.descripcion || ''}
          onChange={onChange}
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
          required
        />
      </div>

      {/* Cursos */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Cursos dictados en USS</label>
        <textarea
          name="cursosDictados"
          placeholder="Ej: Matemáticas I, Física II (lista separados por comas)"
          value={formData.cursosDictados || ''}
          onChange={onChange}
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
        />
      </div>

      {/* Botón de submit */}
      <button 
        type="submit" 
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {buttonText}
      </button>
    </form>
  );
};

export default DocenteForm;