// src/components/DocenteForm.jsx (CORREGIDO)
import React, { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const DocenteForm = ({ onSubmit, formData, onChange, buttonText = "Guardar", setFormData }) => {
  const [uploading, setUploading] = useState(false);

  // Manejo de imagen (guardamos el File, no el base64)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData({ ...formData, fotoFile: file });
  };

  // Subir imagen a Firebase Storage y obtener URL
  const uploadImageAndGetURL = async (file) => {
    if (!file) return null;

    const storage = getStorage();
    const fileRef = ref(storage, `fotos/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // ✅ Manejo de envío CORREGIDO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let fotoURL = formData.foto || null;

    // Si hay un archivo nuevo, lo subimos
    if (formData.fotoFile) {
      fotoURL = await uploadImageAndGetURL(formData.fotoFile);
    }

    // ✅ Crear objeto limpio sin fotoFile
    const dataToSave = {
      nombre: formData.nombre,
      fechaNacimiento: formData.fechaNacimiento
        ? new Date(formData.fechaNacimiento).toISOString().split("T")[0]
        : "",
      dni: formData.dni,
      celular: formData.celular,
      correoPersonal: formData.correoPersonal,
      correoInstitucional: formData.correoInstitucional,
      direccion: formData.direccion,
      descripcion: formData.descripcion,
      cursosDictados: formData.cursosDictados,
      horariosDisponibles: formData.horariosDisponibles,
    };

    // ✅ Solo agregar foto si existe
    if (fotoURL) {
      dataToSave.foto = fotoURL;
    }

    setUploading(false);
    onSubmit(e, dataToSave);
  };

  // Vista previa (si hay archivo local o URL)
  const previewSrc = formData.fotoFile
    ? URL.createObjectURL(formData.fotoFile)
    : formData.foto || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre || ""}
          onChange={onChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Fecha de nacimiento */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de nacimiento</label>
        <input
          type="date"
          name="fechaNacimiento"
          value={formData.fechaNacimiento || ""}
          onChange={onChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* DNI */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
        <input
          type="text"
          name="dni"
          value={formData.dni || ""}
          onChange={onChange}
          maxLength={8}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Correo personal */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Correo personal</label>
        <input
          type="email"
          name="correoPersonal"
          value={formData.correoPersonal || ""}
          onChange={onChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Correo institucional */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Correo institucional</label>
        <input
          type="email"
          name="correoInstitucional"
          value={formData.correoInstitucional || ""}
          onChange={onChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
        <input
          type="text"
          name="direccion"
          value={formData.direccion || ""}
          onChange={onChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Celular */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Celular</label>
        <input
          type="text"
          name="celular"
          value={formData.celular || ""}
          onChange={onChange}
          maxLength={9}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Foto */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Foto</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {previewSrc && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
            <img
              src={previewSrc}
              alt="Vista previa"
              className="w-full max-w-xs max-h-48 rounded-xl border border-gray-300 object-cover bg-gray-50 shadow-md"
              onError={(e) => {
                e.target.src = "https://placehold.co/320x320?text=Sin+Foto";
              }}
            />
          </div>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
        <textarea
          name="descripcion"
          value={formData.descripcion || ""}
          onChange={onChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          rows="3"
          required
        />
      </div>

      {/* Cursos dictados */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Cursos dictados en USS</label>
        <input
          type="text"
          name="cursosDictados"
          value={formData.cursosDictados || ""}
          onChange={onChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ej: Matemáticas, Física, Química"
        />
      </div>

      {/* Horarios disponibles */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-200">
        <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span className="text-amber-600">📅</span>
          Ciclo Intensivo Noviembre - Horarios Disponibles
        </label>
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
          Indica los días y horarios en los que estás disponible para dictar clases.
        </p>
        <textarea
          name="horariosDisponibles"
          value={formData.horariosDisponibles || ""}
          onChange={onChange}
          className="w-full border-2 border-amber-300 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-vertical bg-white"
          rows="3"
          placeholder="Ej: Lunes 8:00-12:00, Martes 14:00-18:00, Jueves 9:00-13:00"
        />
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={!formData.nombre || !formData.correoPersonal || !formData.descripcion || uploading}
        className="w-full disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {uploading ? "Subiendo..." : buttonText || "Guardar"}
      </button>
    </form>
  );
};

export default DocenteForm;