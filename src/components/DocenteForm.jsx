// src/components/DocenteForm.jsx
import React, { useState } from 'react';
import { FiCamera } from 'react-icons/fi';

const DocenteForm = ({ onSubmit, formData, onChange }) => {
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
        <input
          type="text"
          name="nombre"
          placeholder="Ej: Juan Pérez"
          value={formData.nombre}
          onChange={onChange}
          className="input-field p-3"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
        <input
          type="date"
          name="fechaNacimiento"
          value={formData.fechaNacimiento}
          onChange={onChange}
          className="input-field p-3"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">DNI</label>
        <input
          type="text"
          name="dni"
          placeholder="Ej: 12345678"
          value={formData.dni}
          onChange={onChange}
          className="input-field p-3"
          maxLength="8"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Número de celular</label>
        <input
          type="tel"
          name="celular"
          placeholder="Ej: +51 999 123 456"
          value={formData.celular}
          onChange={onChange}
          className="input-field p-3"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Correo personal</label>
        <input
          type="email"
          name="correoPersonal"
          placeholder="Ej: juan@gmail.com"
          value={formData.correoPersonal}
          onChange={onChange}
          className="input-field p-3"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Correo institucional</label>
        <input
          type="email"
          name="correoInstitucional"
          placeholder="Ej: juan@uss.edu.pe"
          value={formData.correoInstitucional}
          onChange={onChange}
          className="input-field p-3"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
        <input
          type="text"
          name="direccion"
          placeholder="Ej: Av. Principal 123, Lima"
          value={formData.direccion}
          onChange={onChange}
          className="input-field p-3"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
          <FiCamera className="mr-1" size={16} />
          Foto de perfil (opcional)
        </label>
        <input
          type="file"
          name="fotoBase64"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="input-field p-3"
        />
        {fotoBase64 && (
          <div className="mt-2">
            <img src={fotoBase64} alt="Preview" className="w-16 h-16 object-cover rounded-lg shadow-sm border border-gray-200" />
            <p className="text-xs text-gray-500 mt-1">Vista previa</p>
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          name="descripcion"
          placeholder="Breve bio, materias impartidas, experiencia..."
          value={formData.descripcion}
          onChange={onChange}
          rows="3"
          className="input-field p-3 resize-none"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Cursos dictados en USS</label>
        <textarea
          name="cursosDictados"
          placeholder="Ej: Matemáticas I, Física II (lista separados por comas)"
          value={formData.cursosDictados}
          onChange={onChange}
          rows="3"
          className="input-field p-3 resize-none"
        />
      </div>
      <button type="submit" className="w-full btn-success py-3 text-sm">
        Guardar Docente
      </button>
    </form>
  );
};

export default DocenteForm;