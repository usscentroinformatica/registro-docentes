// src/components/ArchivosPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FiDownload, 
  FiTrash2, 
  FiFileText, 
  FiUpload, 
  FiPaperclip,
  FiFile, 
  FiImage, 
  FiArchive,
  FiCheck, 
  FiX 
} from 'react-icons/fi';

const ArchivosPanel = ({ userMode, docenteId }) => {
  const [archivos, setArchivos] = useState([]);
  const [file, setFile] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
  const RAW_CHUNK_BYTES = 700 * 1024;

  // Perfil del docente logueado
  const perfilRaw = localStorage.getItem('docentePerfil');
  let perfil = null;
  try { perfil = perfilRaw ? JSON.parse(perfilRaw) : null; } catch (e) { perfil = null; }
  const currentUserId = perfil?.id || null;
  const currentUserDni = perfil?.dni || null;
  const currentUserName = perfil?.nombre || 'Usuario';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // SOLUCIÓN DEFINITIVA: Solo carga TUS archivos (nunca los de otros)
  // SOLUCIÓN DEFINITIVA: Cargar archivos según el rol
useEffect(() => {
  console.log('🔍 ArchivosPanel - Iniciando carga:', {
    userMode,
    docenteId,
    currentUserId,
    currentUserDni,
    perfil
  });

  if (!currentUserId && !currentUserDni && userMode !== 'admin') {
    console.log('❌ No hay identificadores para cargar archivos');
    setArchivos([]);
    return;
  }

  let unsub;

  if (userMode === 'admin') {
    // Admin: si tiene docenteId específico, mostrar solo archivos de ese docente
    if (docenteId) {
      const identifiers = [docenteId, currentUserDni].filter(Boolean);
      console.log('👨‍💼 Admin viendo archivos del docente:', identifiers);
      
      unsub = onSnapshot(
        query(
          collection(db, 'archivos'),
          where('docenteId', 'in', identifiers)
        ),
        (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
          setArchivos(data);
          console.log('📁 Archivos del docente encontrados:', data.length);
        },
        (err) => {
          console.error('Error cargando archivos del docente:', err);
          showToast('Error al cargar archivos', 'error');
        }
      );
    } else {
      // Admin en vista general - todos los archivos
      console.log('👨‍💼 Admin viendo TODOS los archivos');
      unsub = onSnapshot(collection(db, 'archivos'), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
        setArchivos(data);
      });
    }
  } else {
    // DOCENTE: debe ver archivos donde sea destinatario O subidor
    const identifiers = [currentUserId, currentUserDni].filter(Boolean);
    console.log('👨‍🏫 Docente buscando archivos con identificadores:', identifiers);
    
    if (identifiers.length === 0) {
      console.log('⚠️ No hay identificadores para el docente');
      setArchivos([]);
      return;
    }

    // **CONSULTA CORREGIDA: Obtener todos y filtrar**
    unsub = onSnapshot(
      collection(db, 'archivos'),
      (snap) => {
        const todosArchivos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('📂 Total de archivos en BD:', todosArchivos.length);
        
        // Filtrar archivos del docente
        const archivosFiltrados = todosArchivos.filter(archivo => {
          // Verificar si el docente es destinatario
          const esDestinatario = identifiers.some(id => {
            const match = archivo.docenteId === id;
            if (match) console.log('✅ Archivo destinatario:', archivo.name, 'docenteId:', archivo.docenteId);
            return match;
          });
          
          // Verificar si el docente subió el archivo
          const esSubidor = identifiers.some(id => {
            const match = archivo.uploadedBy === id;
            if (match) console.log('✅ Archivo subido por docente:', archivo.name, 'uploadedBy:', archivo.uploadedBy);
            return match;
          });
          
          return esDestinatario || esSubidor;
        });
        
        console.log('📊 Archivos filtrados para docente:', archivosFiltrados.length);
        
        archivosFiltrados.sort((a, b) => 
          (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)
        );
        
        setArchivos(archivosFiltrados);
      },
      (err) => {
        console.error('❌ Error cargando archivos:', err);
        showToast('Error al cargar archivos', 'error');
      }
    );
  }

  return () => {
    if (unsub) unsub();
  };
}, [userMode, docenteId, currentUserId, currentUserDni, showToast]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > MAX_FILE_BYTES) {
        showToast('Archivo demasiado grande (máx 10 MB)', 'error');
      } else {
        setFile(selected);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return showToast('Selecciona un archivo', 'error');

    setLoading(true);
    try {
      const totalChunks = Math.ceil(file.size / RAW_CHUNK_BYTES);

      const metadata = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        descripcion: descripcion.trim() || 'Sin descripción',
        scope: 'private',
        docenteId: docenteId || currentUserId,
        uploadedBy: currentUserId || currentUserDni,
        uploadedByName: currentUserName,
        createdAt: new Date(),
        chunkCount: totalChunks
      };

      const metaRef = await addDoc(collection(db, 'archivos'), metadata);

      const readChunk = (blob) => new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(blob);
      });

      let offset = 0;
      let index = 0;
      while (offset < file.size) {
        const blob = file.slice(offset, offset + RAW_CHUNK_BYTES);
        const dataUrl = await readChunk(blob);
        await setDoc(doc(db, 'archivos', metaRef.id, 'chunks', String(index)), { index, dataUrl });
        offset += RAW_CHUNK_BYTES;
        index++;
      }

      showToast('¡Archivo subido correctamente!', 'success');
      setFile(null);
      setDescripcion('');
    } catch (err) {
      console.error('Error subiendo archivo:', err);
      showToast('Error al subir el archivo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (archivo) => {
    try {
      const chunksSnap = await getDocs(collection(db, 'archivos', archivo.id, 'chunks'));
      if (chunksSnap.empty) return showToast('Archivo no disponible', 'error');

      const chunks = chunksSnap.docs.map(d => d.data()).sort((a, b) => a.index - b.index);
      const dataUrlToUint8 = (dataUrl) => {
        const base64 = dataUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      };

      const arrays = chunks.map(c => dataUrlToUint8(c.dataUrl));
      const result = new Uint8Array(arrays.reduce((a, b) => a + b.length, 0));
      let offset = 0;
      arrays.forEach(arr => { result.set(arr, offset); offset += arr.length; });

      const blob = new Blob([result], { type: archivo.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = archivo.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Error al descargar', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const chunksSnap = await getDocs(collection(db, 'archivos', deleteConfirm.id, 'chunks'));
      await Promise.all(chunksSnap.docs.map(d => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'archivos', deleteConfirm.id));
      setArchivos(prev => prev.filter(a => a.id !== deleteConfirm.id));
      showToast('Archivo eliminado', 'success');
    } catch (err) {
      showToast('Error al eliminar', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const puedeEliminar = (archivo) => {
    if (userMode === 'admin') return true;
    return archivo.uploadedBy === currentUserId || archivo.uploadedBy === currentUserDni;
  };

  const getFileIcon = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return <FiImage className="text-blue-600" size={36} />;
    if (['zip','rar','7z','tar','gz'].includes(ext)) return <FiArchive className="text-orange-600" size={36} />;
    if (['doc','docx','xls','xlsx','ppt','pptx'].includes(ext)) return <FiFileText className="text-blue-800" size={36} />;
    if (ext === 'pdf') return <FiFileText className="text-red-600" size={36} />;
    return <FiFile className="text-gray-600" size={36} />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-blue-800 mb-5 flex items-center gap-2">
          <FiPaperclip className="text-blue-600" />
          Mis Archivos
        </h3>

        {/* Formulario de subida */}
        {(userMode === 'admin' || userMode === 'docente' || docenteId) && (
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 mb-6">
            <h4 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <FiUpload className="text-blue-600" />
              Subir nuevo archivo
            </h4>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo (máx 10 MB)
                </label>
                <label className="block w-full px-6 py-8 border-2 border-dashed border-blue-300 rounded-xl text-center cursor-pointer hover:border-blue-500 transition bg-white">
                  <FiUpload className="mx-auto text-blue-600 mb-3" size={40} />
                  <p className="text-blue-700 font-medium">Haz clic para seleccionar cualquier archivo</p>
                  <p className="text-xs text-gray-500 mt-2">PDF, Word, ZIP, RAR, imágenes, etc.</p>
                  <input type="file" onChange={handleFileChange} className="hidden" />
                </label>

                {file && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-4">
                    {getFileIcon(file.name)}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                      <p className="text-sm text-gray-600">{formatSize(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => setFile(null)} className="text-red-600 hover:text-red-800">
                      <FiX size={20} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Constancia de estudios, backup..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {loading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de archivos */}
        <div className="space-y-3">
          {archivos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aún no has subido ningún archivo.</p>
          ) : (
            archivos.map(archivo => (
              <div key={archivo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow transition">
                <div className="flex items-center gap-4 flex-1">
                  {getFileIcon(archivo.name)}
                  <div>
                    <p className="font-semibold text-gray-900">{archivo.name}</p>
                    {archivo.descripcion && <p className="text-sm text-gray-600">{archivo.descripcion}</p>}
                    <p className="text-xs text-gray-500">
                      {formatSize(archivo.size)} • {new Date(archivo.createdAt?.toDate?.() || archivo.createdAt).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(archivo)}
                    className="p-3 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
                    title="Descargar"
                  >
                    <FiDownload size={20} />
                  </button>

                  {puedeEliminar(archivo) && (
                    <button
                      onClick={() => setDeleteConfirm({ id: archivo.id, name: archivo.name })}
                      className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      title="Eliminar"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Eliminar archivo</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de eliminar permanentemente?<br/>
              <span className="font-bold text-red-600">"{deleteConfirm.name}"</span>
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                <FiTrash2 /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.message && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <FiCheck size={20} /> : <FiX size={20} />}
          {toast.message}
        </div>
      )}
    </>
  );
};

export default ArchivosPanel;
