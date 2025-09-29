// src/components/ModalAgregarDocente.jsx
import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import DocenteForm from './DocenteForm';

const ModalAgregarDocente = ({ isOpen, onClose, onSubmit, formData, onChange, setFormData }) => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Pre-llena con datos de Google
      setFormData({
        nombre: user.displayName || '',
        correoPersonal: user.email || '',
        foto: user.photoURL || '',
        descripcion: `Docente registrado vía Google. Bienvenido, ${user.displayName}!`
      });
      alert('¡Datos cargados! Completa manualmente la fecha, DNI, celular, correos, dirección y cursos dictados.');
    } catch (error) {
      console.error('Error con Google:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        alert('Sesión cancelada. Intenta de nuevo o completa manualmente.');
      } else {
        alert('Error al iniciar sesión con Google. Intenta manual.');
      }
    }
    setGoogleLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
      <div className="modal-bg p-8 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Agregar Docente</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1"
          >
            <FiX size={24} />
          </button>
        </div>
        {/* Botón Google Sign-In */}
        <div className="mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-300 py-4 px-6 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all duration-200 text-gray-700 font-medium text-sm"
          >
            {googleLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                <span>Cargando...</span>
              </>
            ) : (
              <>
                <img 
                  src="https://developers.google.com/identity/images/g-logo.png" 
                  alt="Google" 
                  className="w-6 h-6"
                />
                <span>Iniciar sesión con Google</span>
              </>
            )}
          </button>
          <p className="text-center text-sm text-gray-500 mt-3">O completa el formulario manualmente</p>
        </div>
        <DocenteForm
          onSubmit={onSubmit}
          formData={formData}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default ModalAgregarDocente;