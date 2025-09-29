// src/components/ModalLogin.jsx
import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { FiX, FiUser, FiLock } from 'react-icons/fi';

const ModalLogin = ({ isOpen, onClose, onLogin }) => {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dni.trim()) {
      setError('Ingresa tu DNI.');
      return;
    }

    setLoading(true);
    setError('');

    // Busca en colección 'admins' en Firestore (interno)
    try {
      const q = query(collection(db, 'admins'), where('dni', '==', dni.toUpperCase()));
      const snapshot = await getDocs(q);
      const admin = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];

      if (admin) {
        localStorage.setItem('userMode', 'admin');
        localStorage.setItem('dni', dni);
        onLogin('admin', dni);
        return;
      }
    } catch (err) {
      console.error('Error verificando admin:', err);
      // Continúa al chequeo de docente si no es admin
    }

    // Busca en Firestore por DNI para docentes (como antes)
    try {
      const q = query(collection(db, 'docentes'), where('dni', '==', dni));
      const snapshot = await getDocs(q);
      const docente = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];

      if (docente) {
        localStorage.setItem('userMode', 'docente');
        localStorage.setItem('dni', dni);
        onLogin('docente', docente);
      } else {
        setError('DNI no encontrado. Verifica o contacta al administrador.');
      }
    } catch (err) {
      setError('Error al verificar DNI. Intenta de nuevo.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setDni('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200 transform transition-all duration-300 hover:scale-[1.02]">
        {/* Header más pequeño con subtítulo */}
        <div className="bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] px-6 py-4 flex justify-between items-center relative overflow-hidden">
          {/* Decoración sutil */}
          <div className="absolute inset-0 bg-white opacity-5"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FiUser size={20} />
              <span>Iniciar Sesión</span>
            </h2>
            <p className="text-xs text-white/80 mt-1">Ingresa tu DNI para acceder al sistema</p>
          </div>
          <button
            onClick={handleClose}
            className="relative z-10 text-white hover:text-gray-200 transition-all duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 hover:scale-110"
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Contenido del formulario con mejor espaciado */}
        <div className="p-6 space-y-6">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <FiUser size={16} className="text-gray-400" />
                <span>DNI</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ej: 12345678"
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4682B4] focus:border-[#4682B4] transition-all duration-300 bg-gray-50 hover:bg-white"
                  maxLength="8"
                />
              </div>
            </div>
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-3">
                <p className="text-red-600 text-sm text-center flex items-center justify-center space-x-1">
                  <FiLock size={16} />
                  <span>{error}</span>
                </p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] text-white py-3 rounded-2xl font-semibold text-base hover:from-[#3A6FA1] hover:to-[#4682B4] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <FiLock size={16} />
                    <span>Ingresar</span>
                  </>
                )}
              </span>
              {/* Efecto de brillo sutil */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-10% to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalLogin;