// src/components/EventoForm.jsx
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FiX } from "react-icons/fi";

const EventoForm = ({ onClose }) => {
  const [formData, setFormData] = useState({ titulo: "", descripcion: "", fecha: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.fecha) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "eventos"), {
        ...formData,
        creadoEn: new Date(),
      });
      setLoading(false);
      onClose();
    } catch (err) {
      console.error("Error al crear evento:", err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative border border-blue-200 animate-fadeIn">
        {/* Botón de cerrar */}
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
              className="px-5 py-2 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-all shadow-md"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventoForm;
