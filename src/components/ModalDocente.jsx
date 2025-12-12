// src/components/ModalDocente.jsx (CORREGIDO - LIMPIO)
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs, addDoc, setDoc, deleteDoc, doc as firestoreDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import emailjs from '@emailjs/browser';
import { FiX, FiDownload, FiTrash2 } from 'react-icons/fi';

const ModalDocente = ({ docente, onClose }) => {
  // Inicializar EmailJS solo una vez
  React.useEffect(() => {
    emailjs.init('MhLednlk47LyghD7y');
  }, []);

  // Archivos relacionados al docente
  const [archivos, setArchivos] = useState([]);

  useEffect(() => {
    if (!docente) return;

    // Subscribe only to public files + files for this docente
    let unsubPublic = null;
    let unsubPrivate = null;

    const mergeAndSet = (lists) => {
      const map = new Map();
      lists.flat().forEach(item => map.set(item.id, item));
      const data = Array.from(map.values());
      data.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      setArchivos(data);
    };

    const publicQ = query(collection(db, 'archivos'), where('scope', '==', 'public'));
    unsubPublic = onSnapshot(publicQ, (snap) => {
      const publicItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      mergeAndSet([publicItems]);
    }, (err) => console.error('Error cargando archivos públicos en modal docente:', err));

    const privateQ = query(collection(db, 'archivos'), where('docenteId', '==', docente.id));
    unsubPrivate = onSnapshot(privateQ, (snap) => {
      const privateItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      mergeAndSet([privateItems]);
    }, (err) => console.error('Error cargando archivos privados en modal docente:', err));

    return () => {
      if (unsubPublic) unsubPublic();
      if (unsubPrivate) unsubPrivate();
    };
  }, [docente]);

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

  const handleDeleteArchivo = async (archivoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Eliminar chunks primero (si existen)
      try {
        const chunksSnap = await getDocs(collection(db, 'archivos', archivoId, 'chunks'));
        for (const cd of chunksSnap.docs) {
          await deleteDoc(firestoreDoc(db, 'archivos', archivoId, 'chunks', cd.id));
        }
      } catch (err) {
        console.debug('No se encontraron chunks o error al borrar chunks:', err);
      }

      // Eliminar documento principal
      await deleteDoc(firestoreDoc(db, 'archivos', archivoId));
      alert('Archivo eliminado correctamente.');
    } catch (err) {
      console.error('Error eliminando archivo:', err);
      alert('Error al eliminar el archivo.');
    }
  };

  // Limpiar el placeholder para comparación
  const placeholderUrl = 'https://placehold.co/320x320?text=Sin+Foto';

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
            <div className="space-y-4 sm:space-y-6 relative">
              {/* Campos del docente */}
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
                <label className="block text-sm font-semibold text-gray-700">Carrera profesional</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.carreraProfesional || 'No especificada'}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Grado académico</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.gradoAcademico || 'No especificado'}</p>
              </div>
              {/* Maestría en... solo si selecciona Maestría */}
              {docente.gradoAcademico === 'Maestría' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Maestría en...</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.maestriaEn || 'No especificado'}</p>
                </div>
              )}
              {/* Doctorado en... solo si selecciona Doctorado */}
              {docente.gradoAcademico === 'Doctorado' && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Doctorado en...</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.doctoradoEn || 'No especificado'}</p>
                </div>
              )}
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
                {
                  (() => {
                    const mode = localStorage.getItem('userMode');
                    const perfil = (() => {
                      try { return JSON.parse(localStorage.getItem('docentePerfil')); } catch (e) { return null; }
                    })();
                    const isOwnerDocente = mode === 'docente' && perfil && docente && perfil.id === docente.id;
                    if (mode === 'admin' || isOwnerDocente) {
                      // admin: keep original amber/green style
                      // owner (docente): use blue style
                      const adminLabelClass = 'inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-white rounded-lg text-xs cursor-pointer';
                      const adminButtonClass = 'px-3 py-1 bg-green-600 text-white rounded-lg text-xs';
                      const ownerLabelClass = 'inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs cursor-pointer';
                      const ownerButtonClass = 'px-4 py-2 bg-blue-600 text-white rounded-lg text-sm';
                      const isAdmin = mode === 'admin';
                      const labelClass = isAdmin ? adminLabelClass : ownerLabelClass;
                      const buttonClass = isAdmin ? adminButtonClass : ownerButtonClass;

                      return (
                        <div className="mt-3 w-full text-right">
                          <input type="file" id="uploadDocenteFile" onChange={handleSelectUpload} className="hidden" />
                          <div className="flex items-center justify-end gap-2">
                            <input type="text" placeholder="Descripción (opcional)" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} className="text-sm border rounded-lg px-2 py-1 w-48" />
                            <label htmlFor="uploadDocenteFile" className={labelClass}>Seleccionar</label>
                            <button onClick={handleUploadToDocente} disabled={uploading} className={buttonClass}>{uploading ? 'Subiendo...' : 'Subir al docente'}</button>
                          </div>
                          {uploadFile && <p className="text-xs text-gray-500 mt-1">Archivo seleccionado: {uploadFile.name} ({Math.round(uploadFile.size/1024)} KB)</p>}
                        </div>
                      );
                    }
                    return null;
                  })()
                }
              </div>
            </div>
          </div>
            {/* Archivos adjuntos */}
            <div className="w-full mt-6">
              <h4 className="text-sm font-bold text-blue-700 mb-2">Archivos adjuntos</h4>
              {(() => {
                if (!archivos || archivos.length === 0) return <p className="text-sm text-gray-500">No hay archivos adjuntos.</p>;

                const mode = localStorage.getItem('userMode');
                const perfilRaw = localStorage.getItem('docentePerfil');
                let perfil = null;
                try { perfil = perfilRaw ? JSON.parse(perfilRaw) : null; } catch (e) { perfil = null; }

                // Admin: show only files that belong to this docente (avoid showing global public files)
                if (mode === 'admin') {
                  const visiblesAdmin = archivos.filter(a => {
                    if (!a) return false;
                    if (a.docenteId && (a.docenteId === docente.id || a.docenteId === docente.dni)) return true;
                    return false;
                  });

                  if (visiblesAdmin.length === 0) return <p className="text-sm text-gray-500">No hay archivos adjuntos para este docente.</p>;

                  return (
                    <div className="space-y-2">
                      {visiblesAdmin.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{a.name}</p>
                            <p className="text-xs text-gray-500">{a.descripcion}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDownloadArchivo(a)} className="px-3 py-1 bg-emerald-500 text-white rounded-md text-sm">Descargar</button>
                            <button onClick={() => handleDeleteArchivo(a.id)} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm">Eliminar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                // For non-admin: show only files that belong to this docente.
                const visibles = archivos.filter(a => {
                  if (!a) return false;
                  // match by explicit docenteId (two legacy possibilities: stored as doc id or as DNI)
                  if (a.docenteId && (a.docenteId === docente.id || a.docenteId === docente.dni)) return true;
                  // or match by uploader user id (perfil.id = userId from localStorage after login)
                  if (perfil && a.uploadedBy && perfil.id && a.uploadedBy === perfil.id) return true;
                  return false;
                });

                if (visibles.length === 0) return <p className="text-sm text-gray-500">No hay archivos para este docente.</p>;

                return (
                  <div className="space-y-2">
                    {visibles.map(a => {
                      // Docente can delete his own uploaded files
                      const canDelete = perfil && a.uploadedBy && perfil.id && a.uploadedBy === perfil.id;
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{a.name}</p>
                            <p className="text-xs text-gray-500">{a.descripcion}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDownloadArchivo(a)} className="px-3 py-1 bg-emerald-500 text-white rounded-md text-sm">Descargar</button>
                            {canDelete && (
                              <button onClick={() => handleDeleteArchivo(a.id)} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm flex items-center gap-1">
                                <FiTrash2 size={14} /> Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDocente;
