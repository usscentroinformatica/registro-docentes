// src/components/ModalDocente.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs, addDoc, setDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '../firebase';
import emailjs from '@emailjs/browser';
import { FiX, FiDownload, FiSend } from 'react-icons/fi';

const ModalDocente = ({ docente, onClose }) => {
  // Inicializar EmailJS solo una vez
  React.useEffect(() => {
    emailjs.init('MhLednlk47LyghD7y');
  }, []);

  // Estado para el modal de correo
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailData, setMailData] = useState({ asunto: '', mensaje: '', destinatario: '' });

  // Archivos relacionados al docente
  const [archivos, setArchivos] = useState([]);

  useEffect(() => {
    if (!docente) return;

    const colRef = collection(db, 'archivos');
    const unsub = onSnapshot(colRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setArchivos(items);
    }, (err) => {
      console.error('Error cargando archivos en modal docente:', err);
    });

    return () => unsub();
  }, [docente]);

  // Función para abrir el modal de correo
  const handleOpenMailModal = (destinatario, curso) => {
    setMailData({
      asunto: `Asignación sobre el curso ${curso.curso} (${curso.seccion})`,
      mensaje: `Hola ${docente.nombre},\n\nMe comunico respecto al curso ${curso.curso} (${curso.seccion}).`,
      destinatario,
      curso
    });
    setShowMailModal(true);
  };

  // Función para enviar el correo real con EmailJS
  const handleSendMail = async () => {
    try {
      const templateId = 'template_6oiipvk';
      const periodo = 'Noviembre 2025 II';
      let modalidad = 'Virtual';
      const seccion = mailData.curso.seccion;

      if (docente.correoInstitucional) {
        await emailjs.send(
          'service_ka6bpim',
          templateId,
          {
            nombre_docente: docente.nombre,
            email: docente.correoInstitucional,
            nombre_curso: mailData.curso.curso,
            periodo,
            modalidad,
            seccion,
            dias: mailData.curso.dias,
            horario: `${mailData.curso.horaInicio} - ${mailData.curso.horaFin}`,
            title: mailData.asunto,
            message: mailData.mensaje
          }
        );

        // Copia a paccis
        await emailjs.send(
          'service_ka6bpim',
          templateId,
          {
            nombre_docente: docente.nombre,
            email: 'paccis@uss.edu.pe',
            nombre_curso: mailData.curso.curso,
            periodo,
            modalidad,
            seccion,
            dias: mailData.curso.dias,
            horario: `${mailData.curso.horaInicio} - ${mailData.curso.horaFin}`,
            title: mailData.asunto,
            message: mailData.mensaje
          }
        );
        alert('¡Correo enviado exitosamente!');
      } else {
        alert('El docente no tiene correo institucional registrado.');
      }
    } catch (error) {
      alert('Error al enviar el correo. Intenta de nuevo.');
      console.error('Error detallado:', error);
    }
    setShowMailModal(false);
  };

  // Subida de archivos dirigida a este docente (solo admin)
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);

  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
  const RAW_CHUNK_BYTES = 700 * 1024; // ~700 KB raw chunk

  const handleSelectUpload = (e) => {
    const f = e.target.files[0];
    setUploadFile(f || null);
  };

  const handleUploadToDocente = async () => {
    if (!uploadFile) return alert('Selecciona un archivo para subir.');
    if (uploadFile.size > MAX_FILE_BYTES) return alert('Archivo demasiado grande. Máx 5 MB.');

    setUploading(true);
    try {
      const totalChunks = Math.ceil(uploadFile.size / RAW_CHUNK_BYTES);
      const metadata = {
        name: uploadFile.name,
        mimeType: uploadFile.type || 'application/octet-stream',
        size: uploadFile.size || 0,
        descripcion: uploadDesc || '',
        downloadURL: null,
        storagePath: null,
        scope: 'private',
        docenteId: docente.id,
        uploadedBy: localStorage.getItem('userId') || null,
        createdAt: new Date(),
        chunkCount: totalChunks
      };

      const metaRef = await addDoc(collection(db, 'archivos'), metadata);

      const readChunkAsDataUrl = (blob) => new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });

      let offset = 0;
      let index = 0;
      while (offset < uploadFile.size) {
        const end = Math.min(offset + RAW_CHUNK_BYTES, uploadFile.size);
        const blob = uploadFile.slice(offset, end);
        const dataUrl = await readChunkAsDataUrl(blob);

        const chunkRef = firestoreDoc(db, 'archivos', metaRef.id, 'chunks', String(index));
        await setDoc(chunkRef, { index, dataUrl });

        offset = end;
        index += 1;
      }

      setUploadFile(null);
      setUploadDesc('');
      alert('Archivo subido para el docente.');
    } catch (err) {
      console.error('Error subiendo archivo al docente:', err);
      alert('Error subiendo archivo.');
    }
    setUploading(false);
  };

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
    const placeholder = 'https://placehold.co/320x320?text=Sin+Foto';
    if (docente.foto && docente.foto.trim() !== placeholder) {
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

  const handleDownloadArchivo = (archivo) => {
    try {
      if (archivo.downloadURL) {
        // Si fue subido a Storage y guardado URL
        const a = document.createElement('a');
        a.href = archivo.downloadURL;
        a.download = archivo.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      // si no hay downloadURL, intentar dataUrl (legacy)
      const dataUrl = archivo.dataUrl;
      if (dataUrl) {
        const parts = dataUrl.split(',');
        const base64 = parts[1];
        const byteString = atob(base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: archivo.mimeType || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      // fallback: reconstruir desde chunks en Firestore
      (async () => {
        try {
          const chunksSnap = await getDocs(collection(db, 'archivos', archivo.id, 'chunks'));
          if (chunksSnap.empty) {
            alert('No hay URL pública ni datos almacenados para este archivo.');
            return;
          }

          const chunks = chunksSnap.docs.map(d => d.data()).sort((a, b) => a.index - b.index);

          const dataUrlToUint8 = (dataUrl) => {
            const base64 = dataUrl.split(',')[1];
            const binary = atob(base64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
            return bytes;
          };

          const totalSize = archivo.size || chunks.reduce((sum, c) => sum + dataUrlToUint8(c.dataUrl).length, 0);
          const result = new Uint8Array(totalSize);
          let pos = 0;
          for (const c of chunks) {
            const arr = dataUrlToUint8(c.dataUrl);
            result.set(arr, pos);
            pos += arr.length;
          }

          const blob = new Blob([result], { type: archivo.mimeType || 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = archivo.name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Error reconstruyendo chunks:', err);
          alert('No se pudo descargar el archivo desde los chunks.');
        }
      })();
    } catch (err) {
      console.error('Error descargando archivo desde modal:', err);
      alert('No se pudo descargar el archivo.');
    }
  };

  // Limpiar el placeholder para comparación
  const placeholderUrl = 'https://placehold.co/320x320?text=Sin+Foto';

  return (
    <>
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
              <div className="space-y-4 sm:space-y-6 relative">
                {/* Todos tus campos originales aquí (nombre, género, edad, etc.) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Nombre completo</label>
                  <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">{docente.nombre}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Género</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.genero || 'No especificado'}</p>
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
                  <label className="block text-sm font-semibold text-gray-700">Grado académico</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.gradoAcademico || 'No especificado'}</p>
                </div>
                {docente.gradoAcademico === 'Magíster' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Magíster en...</label>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.magisterEn || 'No especificado'}</p>
                  </div>
                )}
                {docente.gradoAcademico === 'Doctor' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Doctorado en...</label>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.doctoradoEn || 'No especificado'}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Dirección</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.direccion || 'No especificada'}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Descripción</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">{docente.descripcion}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Cursos</label>
                  {Array.isArray(docente.cursosDictados) && docente.cursosDictados.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                      {docente.cursosDictados.map((curso, idx) => (
                        <li key={idx}>{curso}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">No especificados</p>
                  )}
                </div>

                {/* Horarios Disponibles */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-amber-600">📅</span>
                    Ciclo Intensivo Noviembre - Horarios Disponibles
                  </label>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border-2 border-amber-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {docente.horariosDisponibles || 'No especificados'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="flex flex-col items-end space-y-2">
                  <img
                    src={docente.foto && docente.foto.trim() !== placeholderUrl ? docente.foto : placeholderUrl}
                    alt={docente.nombre}
                    className="w-48 h-48 sm:w-80 sm:h-80 object-contain bg-gray-50 rounded-xl shadow-md border border-gray-200 ml-auto"
                    style={{ marginRight: '0' }}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/320x320?text=Sin+Foto';
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 font-medium text-right">Foto de perfil</p>
                  {docente.foto && docente.foto.trim() !== placeholderUrl && (
                    <button
                      onClick={handleDownload}
                      className="mt-2 flex items-center space-x-2 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs font-medium ml-auto"
                    >
                      <FiDownload size={12} />
                      <span>Descargar</span>
                    </button>
                  )}

                  {/* Upload button visible only to admins inside the docente card */}
                  {localStorage.getItem('userMode') === 'admin' && (
                    <div className="mt-3 w-full text-right">
                      <input type="file" id="uploadDocenteFile" onChange={handleSelectUpload} className="hidden" />
                      <div className="flex items-center justify-end gap-2">
                        <input type="text" placeholder="Descripción (opcional)" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} className="text-sm border rounded-lg px-2 py-1 w-48" />
                        <label htmlFor="uploadDocenteFile" className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-white rounded-lg text-xs cursor-pointer">Seleccionar</label>
                        <button onClick={handleUploadToDocente} disabled={uploading} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs">{uploading ? 'Subiendo...' : 'Subir al docente'}</button>
                      </div>
                      {uploadFile && <p className="text-xs text-gray-500 mt-1">Archivo seleccionado: {uploadFile.name} ({Math.round(uploadFile.size/1024)} KB)</p>}
                    </div>
                  )}
                </div>

                {/* TABLA DE CURSOS ASIGNADOS - LÓGICA CORREGIDA PARA ESTRELLA */}
                {(() => {
                  let cursosPorDocente;
                  try {
                    cursosPorDocente = require('../data/cursosPorDocente').default;
                  } catch (e) {
                    cursosPorDocente = [];
                  }

                  // Normalización
                  const normalizar = (str) => (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().trim();
                  const nombreDB = normalizar(docente.nombre);
                  const palabrasDB = nombreDB.split(/\s+/);

                  const cursos = cursosPorDocente.filter(c => {
                    const nombreExcel = normalizar(c.docente);
                    const palabrasExcel = nombreExcel.split(/\s+/);

                    // REGLA ESPECIAL PARA ESTRELLA (cualquier variante que contenga "ESTRELLA")
                    const tieneEstrellaDB = palabrasDB.some(p => p === 'ESTRELLA');
                    const tieneEstrellaExcel = palabrasExcel.some(p => p === 'ESTRELLA');

                    if (tieneEstrellaDB || tieneEstrellaExcel) {
                      return tieneEstrellaDB && tieneEstrellaExcel; // si ambos tienen "ESTRELLA" → es el mismo docente
                    }

                    // Para los demás: mínimo 3 coincidencias (tu regla original)
                    const coincidencias = palabrasExcel.filter(p => palabrasDB.includes(p));
                    const diasValido = typeof c.dias === 'string' ? !c.dias.toUpperCase().includes('ALMUERZO') : true;

                    return coincidencias.length >= 3 && diasValido;
                  });

                  if (cursos.length === 0) return null;

                  return (
                    <div className="mt-4 w-full max-w-lg mx-auto">
                      <h4 className="text-sm font-bold text-blue-700 mb-2 text-center">Ciclo Intensivo Noviembre 2025</h4>
                      <div className="overflow-x-auto rounded-xl shadow border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                        <table className="w-full text-xs rounded-xl">
                          <thead>
                            <tr className="bg-blue-200 text-blue-900">
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Curso</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Sección</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Turno</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Días</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Inicio</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Fin</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cursos.map((curso, idx) => (
                              <tr key={idx} className="bg-white even:bg-blue-50 hover:bg-blue-100 transition-all">
                                <td className="px-2 py-1 border-b border-blue-100">{curso.curso}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.seccion}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.turno}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.dias}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.horaInicio}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.horaFin}</td>
                                <td className="px-2 py-1 border-b border-blue-100 text-center">
                                  <button
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition-all text-xs"
                                    title="Enviar correo"
                                    onClick={() => handleOpenMailModal(docente.correoInstitucional, curso)}
                                  >
                                    <FiSend size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
              {/* Archivos adjuntos */}
              <div className="w-full mt-6">
                <h4 className="text-sm font-bold text-blue-700 mb-2">Archivos adjuntos</h4>
                {(() => {
                  if (!archivos || archivos.length === 0) return <p className="text-sm text-gray-500">No hay archivos adjuntos.</p>;

                  const visibles = archivos.filter(a => a.scope === 'public' || (a.scope === 'private' && a.docenteId === docente.id));
                  if (visibles.length === 0) return <p className="text-sm text-gray-500">No hay archivos para este docente.</p>;

                  return (
                    <div className="space-y-2">
                      {visibles.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{a.name}</p>
                            <p className="text-xs text-gray-500">{a.descripcion}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDownloadArchivo(a)} className="px-3 py-1 bg-emerald-500 text-white rounded-md text-sm">Descargar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
          </div>
        </div>
      </div>

      {/* Modal para enviar correo */}
      {showMailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-blue-200">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Enviar correo</h3>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Para:</label>
              <input
                type="text"
                value={`${mailData.destinatario}, paccis@uss.edu.pe`}
                disabled
                className="w-full border-2 border-gray-200 rounded-xl p-2 bg-gray-100 text-gray-700"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Asunto:</label>
              <input
                type="text"
                value={mailData.asunto}
                onChange={e => setMailData({ ...mailData, asunto: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl p-2"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje:</label>
              <textarea
                rows={4}
                value={mailData.mensaje}
                onChange={e => setMailData({ ...mailData, mensaje: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl p-2"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                onClick={() => setShowMailModal(false)}
              >Cancelar</button>
              <button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600"
                onClick={handleSendMail}
              >Enviar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalDocente;
