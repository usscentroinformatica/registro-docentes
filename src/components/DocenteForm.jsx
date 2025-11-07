// src/components/DocenteForm.jsx (CORREGIDO)
import React, { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const DocenteForm = ({ onSubmit, formData, onChange, buttonText = "Guardar", setFormData, isEdit = false }) => {
  // ...existing code...
  // Opciones de dominio para correo personal
  const personalEmailDomains = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "uss.edu.pe"
  ];

  // Manejador para el input de usuario de correo personal
  const handlePersonalEmailUserChange = (e) => {
    const event = { target: { name: 'correoPersonalUser', value: e.target.value } };
    onChange(event);
  };

  // Manejador para el select de dominio
  const handlePersonalEmailDomainChange = (e) => {
    const event = { target: { name: 'correoPersonalDomain', value: e.target.value } };
    onChange(event);
  };
  const [uploading, setUploading] = useState(false);

  // Manejo de imagen como base64
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar el tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }
    
    // Validar el tamaño (máximo 1MB)
    if (file.size > 1024 * 1024) {
      alert('La imagen es demasiado grande. Por favor, usa una imagen más pequeña (máximo 1MB).');
      return;
    }

    try {
      const base64String = await uploadImageAndGetURL(file);
      setFormData({ ...formData, foto: base64String });
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
    }
  };

  // Subir imagen a Firebase Storage y obtener URL
  const uploadImageAndGetURL = async (file) => {
    if (!file) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result;
        // Verificar el tamaño del base64 (límite de Firestore es 1MB)
        if (base64String.length > 1024 * 1024) {
          alert('La imagen es demasiado grande. Por favor, usa una imagen más pequeña (máximo 1MB).');
          reject(new Error('Imagen demasiado grande'));
          return;
        }
        resolve(base64String);
      };
      reader.onerror = (error) => {
        console.error('Error al leer el archivo:', error);
        alert('Error al procesar la imagen. Por favor, intenta con otra imagen.');
        reject(error);
      };
      reader.readAsDataURL(file);
    });
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

    // Construir correo personal completo
    const correoPersonal = formData.correoPersonalUser && formData.correoPersonalDomain
      ? `${formData.correoPersonalUser}@${formData.correoPersonalDomain}`
      : "";

    // ✅ Crear objeto limpio sin fotoFile
    const dataToSave = {
      nombre: formData.nombre,
      fechaNacimiento: formData.fechaNacimiento
        ? new Date(formData.fechaNacimiento).toISOString().split("T")[0]
        : "",
      dni: formData.dni,
      celular: formData.celular,
      correoPersonal,
      // Guardar correo institucional completo
      correoInstitucional: formData.correoInstitucional ? `${formData.correoInstitucional}@uss.edu.pe` : '',
      direccion: formData.direccion,
      gradoAcademico: formData.gradoAcademico || "",
      magisterEn: formData.gradoAcademico === "Magíster" ? (formData.magisterEn || "") : "",
      doctoradoEn: formData.gradoAcademico === "Doctor" ? (formData.doctoradoEn || "") : "",
      genero: formData.genero || "",
      descripcion: formData.descripcion,
      cursosDictados: Array.isArray(formData.cursosDictados) ? formData.cursosDictados : [],
      horariosDisponibles: formData.horariosDisponibles,
    };

    // ✅ Solo agregar foto si existe
    if (fotoURL) {
      dataToSave.foto = fotoURL;
    }

    setUploading(false);
    onSubmit(e, dataToSave);
  };

  // Manejador personalizado para nombre (mayúsculas)
  const handleNameChange = (e) => {
    const event = { target: { name: 'nombre', value: e.target.value.toUpperCase() } };
    onChange(event);
  };

  // Manejador personalizado para correo institucional (solo primera parte)
  const handleInstitutionalEmailChange = (e) => {
    const fullValue = e.target.value;
    const firstPart = fullValue.replace(/@uss\.edu\.pe$/, '').trim();
    const event = { target: { name: 'correoInstitucional', value: firstPart } };
    onChange(event);
  };

  // Vista previa (si hay archivo local o URL)
  const previewSrc = formData.fotoFile
    ? URL.createObjectURL(formData.fotoFile)
    : formData.foto || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">NOMBRES Y APELLIDOS</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre || ""}
          onChange={handleNameChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={!isEdit}
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
          required={!isEdit}
        />
      </div>

      {/* Correo personal */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Correo personal</label>
        <div className="flex items-center">
          <input
            type="text"
            name="correoPersonal"
            value={formData.correoPersonalUser || ""}
            onChange={handlePersonalEmailUserChange}
            className="w-1/2 border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            maxLength={40}
            placeholder="usuario"
            required={!isEdit}
          />
          <span className="mx-2 text-gray-700 text-sm select-none">@</span>
          <select
            name="correoPersonalDomain"
            value={formData.correoPersonalDomain || personalEmailDomains[0]}
            onChange={handlePersonalEmailDomainChange}
            className="w-1/2 border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            required={!isEdit}
          >
            {personalEmailDomains.map((domain) => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Correo institucional */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Correo institucional</label>
        <div className="flex items-center">
          <input
            type="text"
            name="correoInstitucional"
            value={formData.correoInstitucional || ""}
            onChange={handleInstitutionalEmailChange}
            className="w-1/2 border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            maxLength={40}
            placeholder="usuario"
            required={!isEdit}
          />
          <span className="ml-2 text-gray-700 text-sm select-none">@uss.edu.pe</span>
        </div>
      </div>

      {/* Grado académico */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Grado académico</label>
        <select
          name="gradoAcademico"
          value={formData.gradoAcademico || ""}
          onChange={onChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          required={!isEdit}
        >
          <option value="">Seleccione grado</option>
          <option value="Titulado">Titulado</option>
          <option value="Magíster">Magíster</option>
          <option value="Doctor">Doctor</option>
        </select>
      </div>

      {/* Magíster en... solo si selecciona Magíster */}
      {formData.gradoAcademico === "Magíster" && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Magíster en...</label>
          <input
            type="text"
            name="magisterEn"
            value={formData.magisterEn || ""}
            onChange={onChange}
            className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Ej: Educación, Administración, Derecho, etc."
            required={!isEdit}
          />
        </div>
      )}

      {/* Doctorado en... solo si selecciona Doctor */}
      {formData.gradoAcademico === "Doctor" && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Doctorado en...</label>
          <input
            type="text"
            name="doctoradoEn"
            value={formData.doctoradoEn || ""}
            onChange={onChange}
            className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Ej: Ciencias, Educación, Derecho, etc."
            required={!isEdit}
          />
        </div>
      )}

      {/* Género */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Género</label>
        <select
          name="genero"
          value={formData.genero || ""}
          onChange={onChange}
          className="w-full border-2 border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          required={!isEdit}
        >
          <option value="">Seleccione género</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Otro">Otro</option>
        </select>
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
              style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '0.75rem', border: '1px solid #d1d5db', background: '#f8fafc', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', objectFit: 'contain' }}
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
          required={!isEdit}
        />
      </div>

      {/* Cursos (selección múltiple) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Cursos</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border-2 border-gray-200 rounded-xl bg-gray-50">
          {[
            "AUTOCAD 2D",
            "AUTOCAD 3D",
            "BIZAGI",
            "DISEÑO CON CANVA",
            "DISEÑO WEB",
            "EXCEL 365",
            "EXCEL ASOCIADO",
            "POWER BI",
            "PYTHON",
            "WORD 365",
            "WORD ASOCIADO"
          ].map((curso) => (
            <label key={curso} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="cursosDictados"
                value={curso}
                checked={Array.isArray(formData.cursosDictados) && formData.cursosDictados.includes(curso)}
                onChange={e => {
                  let nuevosCursos = Array.isArray(formData.cursosDictados) ? [...formData.cursosDictados] : [];
                  if (e.target.checked) {
                    nuevosCursos.push(curso);
                  } else {
                    nuevosCursos = nuevosCursos.filter(c => c !== curso);
                  }
                  onChange({ target: { name: 'cursosDictados', value: nuevosCursos } });
                }}
                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">{curso}</span>
            </label>
          ))}
        </div>
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
        disabled={uploading}
        className="w-full disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {uploading ? "Subiendo..." : buttonText || "Guardar"}
      </button>
    </form>
  );
};

export default DocenteForm;
