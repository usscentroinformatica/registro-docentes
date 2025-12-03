import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, getDocs, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Panel para subir y listar archivos usando Supabase Storage + Firestore para metadata
const ArchivosPanel = ({ userMode, docenteId }) => {
  const [archivos, setArchivos] = useState([]);
  const [file, setFile] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [docentesList, setDocentesList] = useState([]);
  const [targetDocenteId, setTargetDocenteId] = useState('');

  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
  // when not using external storage, we split the file into chunks
  // ensure each chunk's base64 representation stays below Firestore document limit (~1MB)
  const RAW_CHUNK_BYTES = 700 * 1024; // ~700 KB per raw chunk -> base64 expands but stays < 1MB

  useEffect(() => {
    // Subscribe only to documents the current user should see.
    // Admin: all archivos. Docente: public + private for their docenteId.
    let unsubAll = null;
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

    const perfilRaw = localStorage.getItem('docentePerfil');
    let perfil = null;
    try { perfil = perfilRaw ? JSON.parse(perfilRaw) : null; } catch (e) { perfil = null; }
    const myDocenteId = docenteId || (perfil && perfil.id) || null;

    if (userMode === 'admin') {
      const colRef = collection(db, 'archivos');
      unsubAll = onSnapshot(colRef, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        setArchivos(data);
      }, (err) => console.error('Error cargando archivos (admin):', err));
    } else {
      // subscribe to public
      const publicQ = query(collection(db, 'archivos'), where('scope', '==', 'public'));
      unsubPublic = onSnapshot(publicQ, (snap) => {
        const publicData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mergeAndSet([publicData]);
      }, (err) => console.error('Error cargando archivos públicos:', err));

      // subscribe to private for this docente if we have an id
      if (myDocenteId) {
        const privateQ = query(collection(db, 'archivos'), where('docenteId', '==', myDocenteId));
        unsubPrivate = onSnapshot(privateQ, (snap) => {
          const privateData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          mergeAndSet([privateData]);
        }, (err) => console.error('Error cargando archivos privados:', err));
      }
    }

    return () => {
      if (unsubAll) unsubAll();
      if (unsubPublic) unsubPublic();
      if (unsubPrivate) unsubPrivate();
    };
  }, [userMode, docenteId]);

  useEffect(() => {
    const fetchDocentes = async () => {
      try {
        const snap = await getDocs(collection(db, 'docentes'));
        const list = snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre || '' }));
        setDocentesList(list);
      } catch (err) {
        console.error('Error cargando docentes:', err);
      }
    };

    if (userMode === 'admin') fetchDocentes();
    // if a docenteId context is provided (panel inside a docente card), preselect it
    if (docenteId) {
      setTargetDocenteId(docenteId);
    }
  }, [userMode]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f || null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Selecciona un archivo.');

    if (file.size > MAX_FILE_BYTES) {
      return alert(`Archivo demasiado grande. Máx ${Math.round(MAX_FILE_BYTES / 1024)} KB.`);
    }

    if (allowedTypes.length && !allowedTypes.includes(file.type)) {
      return alert('Tipo no permitido. Usa PDF, PNG o JPG.');
    }

    setLoading(true);
    try {
      // create metadata document first
      const totalChunks = Math.ceil(file.size / RAW_CHUNK_BYTES);

      const metadata = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size || 0,
        descripcion: descripcion || '',
        // when not using external storage, downloadURL/storagePath remain null
        downloadURL: null,
        storagePath: null,
        scope: targetDocenteId ? 'private' : 'public',
        docenteId: targetDocenteId || null,
        uploadedBy: localStorage.getItem('userId') || null,
        createdAt: new Date(),
        chunkCount: totalChunks
      };

      const metaRef = await addDoc(collection(db, 'archivos'), metadata);

      // read and upload chunks
      const readChunkAsDataUrl = (blob) => new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });

      let offset = 0;
      let index = 0;
      while (offset < file.size) {
        const end = Math.min(offset + RAW_CHUNK_BYTES, file.size);
        const blob = file.slice(offset, end);
        const dataUrl = await readChunkAsDataUrl(blob);

        const chunkDocRef = doc(db, 'archivos', metaRef.id, 'chunks', String(index));
        await setDoc(chunkDocRef, { index, dataUrl });

        offset = end;
        index += 1;
      }

      setFile(null);
      setDescripcion('');
      setTargetDocenteId('');
      alert('Archivo subido correctamente (almacenado en Firestore en chunks).');
    } catch (err) {
      console.error('Error subiendo archivo:', err);
      alert('Error subiendo archivo.');
    }
    setLoading(false);
  };

  const handleDownload = async (archivo) => {
    try {
      if (archivo.downloadURL) {
        const a = document.createElement('a');
        a.href = archivo.downloadURL;
        a.download = archivo.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      // fallback: reconstruir desde chunks almacenados en Firestore
      const chunksSnap = await getDocs(collection(db, 'archivos', archivo.id, 'chunks'));
      if (chunksSnap.empty) {
        alert('No hay URL pública ni chunks disponibles para este archivo.');
        return;
      }

      const chunks = chunksSnap.docs.map(d => d.data()).sort((a, b) => a.index - b.index);

      // helper: convertir dataURL -> Uint8Array
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
      console.error('Error descargando archivo:', err);
      alert('No se pudo descargar el archivo.');
    }
  };

  const handleDelete = async (archivoId, storagePath) => {
    if (!window.confirm('¿Eliminar este archivo? Esta acción no se puede deshacer.')) return;
    try {
      // eliminar chunks (si existen)
      try {
        const chunksSnap = await getDocs(collection(db, 'archivos', archivoId, 'chunks'));
        for (const cd of chunksSnap.docs) {
          await deleteDoc(doc(db, 'archivos', archivoId, 'chunks', cd.id));
        }
      } catch (err) {
        // si no hay chunks, continuar
        console.debug('No se encontraron chunks o error al borrar chunks:', err);
      }

      await deleteDoc(doc(db, 'archivos', archivoId));
      alert('Archivo eliminado.');
    } catch (err) {
      console.error('Error eliminando archivo:', err);
      alert('Error eliminando archivo.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Archivos compartidos</h3>

      {(userMode === 'admin' || (userMode === 'docente' && docenteId)) && (
        <form onSubmit={handleUpload} className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar archivo</label>
            <input type="file" onChange={handleFileChange} className="w-full" />
          </div>

          {userMode === 'admin' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destinatario</label>
              <select value={targetDocenteId} onChange={(e) => setTargetDocenteId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                <option value="">-- Público (todos los docentes) --</option>
                {docentesList.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre || d.id}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Si seleccionas un docente, solo él podrá ver/descargar el archivo (en la UI).</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500">Se subirá el archivo para este docente (privado).</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{loading ? 'Subiendo...' : 'Subir archivo'}</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {(() => {
          const perfilRaw = localStorage.getItem('docentePerfil');
          let perfil = null;
          try { perfil = perfilRaw ? JSON.parse(perfilRaw) : null; } catch (e) { perfil = null; }

          const visibles = archivos.filter(a => {
            if (!a) return false;

            // Admin sees everything
            if (userMode === 'admin') return true;

            // If this panel is used inside a docente card (docenteId provided):
            // show only files that belong to that docente (no public files displayed to docentes)
            if (docenteId) {
              if (a.docenteId && (a.docenteId === docenteId || a.docenteId === (perfil && perfil.dni))) return true;
              if (perfil && a.uploadedBy && perfil.uid && a.uploadedBy === perfil.uid) return true;
              return false;
            }

            // No docenteId context: for non-admins show only files that belong to the current docente (perfil)
            if (perfil) {
              if (a.docenteId && (a.docenteId === perfil.id || a.docenteId === perfil.dni)) return true;
              if (a.uploadedBy && perfil.uid && a.uploadedBy === perfil.uid) return true;
            }

            return false;
          });

          if (visibles.length === 0) return <p className="text-sm text-gray-500">No hay archivos disponibles.</p>;

          return visibles.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{a.name}</p>
                <p className="text-xs text-gray-500">{a.descripcion}</p>
                <p className="text-xs text-gray-400">{Math.round((a.size || 0) / 1024)} KB • {a.mimeType} {a.scope === 'private' && a.docenteId ? '• Privado' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(a)} className="px-3 py-1 bg-emerald-500 text-white rounded-md text-sm">Descargar</button>
                {userMode === 'admin' && (
                  <button onClick={() => handleDelete(a.id, a.storagePath)} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm">Eliminar</button>
                )}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

export default ArchivosPanel;
