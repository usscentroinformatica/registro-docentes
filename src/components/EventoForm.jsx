// src/components/EventoForm.jsx
import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FiX, FiUser, FiCheck, FiSearch } from "react-icons/fi";
import emailjs from '@emailjs/browser';

const EventoForm = ({ onClose, docentes = [] }) => {
  const [formData, setFormData] = useState({ 
    titulo: "", 
    descripcion: "", 
    fecha: "",
    hora: "",
    docentesEtiquetados: []
  });
  const [loading, setLoading] = useState(false);
  const [mostrarDocentes, setMostrarDocentes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Inicializar EmailJS
  useEffect(() => {
    emailjs.init('MhLednlk47LyghD7y');
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleDocente = (docenteId) => {
    const yaEstaSeleccionado = formData.docentesEtiquetados.includes(docenteId);
    
    if (yaEstaSeleccionado) {
      setFormData({
        ...formData,
        docentesEtiquetados: formData.docentesEtiquetados.filter(id => id !== docenteId)
      });
    } else {
      setFormData({
        ...formData,
        docentesEtiquetados: [...formData.docentesEtiquetados, docenteId]
      });
    }
  };

  const toggleAll = () => {
    if (formData.docentesEtiquetados.length === docentes.length) {
      setFormData({
        ...formData,
        docentesEtiquetados: []
      });
    } else {
      setFormData({
        ...formData,
        docentesEtiquetados: docentes.map(doc => doc.id)
      });
    }
  };

  const filteredDocentes = docentes.filter(doc => 
    doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.correoPersonal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Enviar emails a los docentes etiquetados
  const enviarEmailsNotificacion = async (tituloEvento, fecha, hora, descripcionEvento, docentesSeleccionados) => {
    for (const docente of docentesSeleccionados) {
      try {
        // Enviar al correo personal
        if (docente.correoPersonal) {
          console.log('Enviando email a:', docente.correoPersonal);
          
          await emailjs.send(
            'service_ka6bpim',
            'template_nchqn3g',
            {
              to_name: docente.nombre,
              to_email: docente.correoPersonal,
              evento_titulo: tituloEvento,
              evento_fecha: `${fecha} a las ${hora}`,
              evento_descripcion: descripcionEvento
            }
          );
          
          console.log('Email personal enviado exitosamente');
        }

        // Enviar al correo institucional si existe
        if (docente.correoInstitucional) {
          console.log('Enviando email a:', docente.correoInstitucional);
          
          await emailjs.send(
            'service_ka6bpim',
            'template_nchqn3g',
            {
              to_name: docente.nombre,
              to_email: docente.correoInstitucional,
              evento_titulo: tituloEvento,
              evento_fecha: `${fecha} a las ${hora}`,
              evento_descripcion: descripcionEvento
            }
          );
          
          console.log('Email institucional enviado exitosamente');
        }
      } catch (error) {
        console.error(`Error enviando email a ${docente.nombre}:`, error);
      }
    }
  };

  // Crear notificaciones para los docentes etiquetados
  const crearNotificaciones = async (eventoId, tituloEvento) => {
    const notificacionesPromises = formData.docentesEtiquetados.map(docenteId => {
      return addDoc(collection(db, "notificaciones"), {
        docenteId: docenteId,
        eventoId: eventoId,
        titulo: "Nuevo evento asignado",
        mensaje: `Has sido etiquetado en el evento: ${tituloEvento}`,
        leida: false,
        createdAt: new Date(),
      });
    });

    await Promise.all(notificacionesPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.fecha || !formData.hora) return;

    setLoading(true);
    try {
      // Crear el evento
      const eventoRef = await addDoc(collection(db, "eventos"), {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        hora: formData.hora,
        docentesEtiquetados: formData.docentesEtiquetados,
        creadoEn: new Date(),
      });

      // Crear notificaciones y enviar emails
      if (formData.docentesEtiquetados.length > 0) {
        await crearNotificaciones(eventoRef.id, formData.titulo);
        
        // Obtener datos completos de los docentes seleccionados
        const docentesParaEmail = docentes.filter(doc => 
          formData.docentesEtiquetados.includes(doc.id)
        );
        
        // Enviar emails (incluyendo la hora y la descripción)
        await enviarEmailsNotificacion(formData.titulo, formData.fecha, formData.hora, formData.descripcion, docentesParaEmail);
      }

      setLoading(false);
      alert('¡Evento creado y notificaciones enviadas!');
      onClose();
    } catch (err) {
      console.error("Error al crear evento:", err);
      alert("Error al crear el evento. Intenta de nuevo.");
      setLoading(false);
    }
  };

  // Obtener nombres de docentes seleccionados
  const docentesSeleccionados = docentes.filter(doc => 
    formData.docentesEtiquetados.includes(doc.id)
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative border border-blue-200 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">
          Agregar Evento
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Nombre del evento"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-vertical"
              placeholder="Detalles del evento"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hora</label>
            <input
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleChange}
              className="w-full border-2 border-blue-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border-2 border-purple-200">
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FiUser className="text-purple-600" />
              Etiquetar Docentes
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Selecciona los docentes que deben ser notificados sobre este evento
            </p>

            {docentesSeleccionados.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {docentesSeleccionados.map(doc => (
                  <span 
                    key={doc.id}
                    className="inline-flex items-center gap-1 bg-purple-600 text-white text-xs px-3 py-1 rounded-full"
                  >
                    {doc.nombre}
                    <button
                      type="button"
                      onClick={() => toggleDocente(doc.id)}
                      className="ml-1 hover:bg-purple-700 rounded-full p-0.5"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMostrarDocentes(!mostrarDocentes)}
              className="w-full bg-white border-2 border-purple-300 text-purple-700 py-2 px-4 rounded-xl font-semibold hover:bg-purple-50 transition-all"
            >
              {mostrarDocentes ? "Ocultar docentes" : `Seleccionar docentes (${formData.docentesEtiquetados.length})`}
            </button>

            {mostrarDocentes && (
              <>
                <div className="relative mb-3 mt-3">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar docentes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="bg-white rounded-xl border-2 border-purple-200 max-h-60 overflow-y-auto">
                  {filteredDocentes.length === 0 ? (
                    <p className="p-4 text-center text-gray-500 text-sm">
                      {searchTerm ? 'No hay docentes que coincidan con la búsqueda' : 'No hay docentes registrados'}
                    </p>
                  ) : (
                    <>
                      <div className="flex justify-between items-center p-3 border-b border-purple-100">
                        <button
                          type="button"
                          onClick={toggleAll}
                          className="text-purple-600 hover:text-purple-800 text-sm font-semibold flex items-center gap-1"
                        >
                          <FiCheck size={12} />
                          {formData.docentesEtiquetados.length === docentes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        </button>
                        <span className="text-xs text-gray-500">
                          {formData.docentesEtiquetados.length} seleccionados de {docentes.length}
                        </span>
                      </div>
                      {filteredDocentes.map(doc => {
                        const estaSeleccionado = formData.docentesEtiquetados.includes(doc.id);
                        const fotoSrc = doc.foto || 'https://via.placeholder.com/40?text=Sin+Foto';
                        
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => toggleDocente(doc.id)}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-purple-50 transition-all border-b border-purple-100 last:border-b-0 ${
                              estaSeleccionado ? 'bg-purple-100' : ''
                            }`}
                          >
                            <img
                              src={fotoSrc}
                              alt={doc.nombre}
                              className="w-10 h-10 rounded-full object-cover border-2 border-purple-300"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=Sin+Foto'; }}
                            />
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-gray-800 text-sm">{doc.nombre}</p>
                              <p className="text-xs text-gray-500">{doc.correoPersonal}</p>
                            </div>
                            {estaSeleccionado && (
                              <div className="bg-purple-600 text-white rounded-full p-1">
                                <FiCheck size={16} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Guardar Evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventoForm;