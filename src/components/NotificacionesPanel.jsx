// src/components/NotificacionesPanel.jsx
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FiBell, FiX, FiCheck, FiTrash2 } from "react-icons/fi";

const NotificacionesPanel = ({ docenteId }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones del docente
  useEffect(() => {
    if (!docenteId) return;

    const q = query(
      collection(db, "notificaciones"),
      where("docenteId", "==", docenteId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      // Ordenar por fecha (más recientes primero)
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setNotificaciones(data);
    });

    return () => unsub();
  }, [docenteId]);

  // Marcar notificación como leída
  const marcarComoLeida = async (notifId) => {
    try {
      const notifRef = doc(db, "notificaciones", notifId);
      await updateDoc(notifRef, { leida: true });
    } catch (err) {
      console.error("Error al marcar como leída:", err);
    }
  };

  // Eliminar notificación
  const eliminarNotificacion = async (notifId) => {
    try {
      await deleteDoc(doc(db, "notificaciones", notifId));
    } catch (err) {
      console.error("Error al eliminar notificación:", err);
    }
  };

  // Marcar todas como leídas
  const marcarTodasComoLeidas = async () => {
    setLoading(true);
    try {
      const promesas = notificaciones
        .filter(n => !n.leida)
        .map(n => updateDoc(doc(db, "notificaciones", n.id), { leida: true }));
      await Promise.all(promesas);
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
    }
    setLoading(false);
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida);

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className="relative p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-400"
      >
        <FiBell size={24} className="text-blue-600" />
        {notificacionesNoLeidas.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {notificacionesNoLeidas.length}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {mostrarPanel && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setMostrarPanel(false)}
          />
          
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border-2 border-blue-200 z-50 max-h-[600px] overflow-hidden flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="p-4 border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FiBell className="text-blue-600" />
                  Notificaciones
                </h3>
                <button
                  onClick={() => setMostrarPanel(false)}
                  className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                >
                  <FiX size={20} className="text-gray-600" />
                </button>
              </div>
              
              {notificacionesNoLeidas.length > 0 && (
                <button
                  onClick={marcarTodasComoLeidas}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <FiCheck size={14} />
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="overflow-y-auto flex-1">
              {notificaciones.length === 0 ? (
                <div className="p-8 text-center">
                  <FiBell size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No tienes notificaciones</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Aquí aparecerán los eventos en los que seas etiquetado
                  </p>
                </div>
              ) : (
                notificaciones.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all ${
                      !notif.leida ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Indicador de no leída */}
                      {!notif.leida && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">
                          {notif.titulo}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {notif.mensaje}
                        </p>
                        <p className="text-xs text-gray-400">
                          {notif.createdAt?.toDate().toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-1">
                        {!notif.leida && (
                          <button
                            onClick={() => marcarComoLeida(notif.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Marcar como leída"
                          >
                            <FiCheck size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => eliminarNotificacion(notif.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificacionesPanel;