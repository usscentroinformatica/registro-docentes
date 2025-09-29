// src/components/ModalLogin.jsx (corregido: sin Google y sin botón X)
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FiUser, FiLock } from 'react-icons/fi';
import DocenteForm from './DocenteForm';

const ModalLogin = ({ isOpen, onClose, onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    fechaNacimiento: '',
    dni: '',
    celular: '',
    correoPersonal: '',
    correoInstitucional: '',
    direccion: '',
    fotoBase64: '',
    foto: '',
    descripcion: '',
    cursosDictados: '',
    horariosDisponibles: ''
  });

  // Definir handleClose con useCallback ANTES del useEffect
  const handleClose = useCallback(() => {
    setDni('');
    setRegisterForm({
      nombre: '',
      fechaNacimiento: '',
      dni: '',
      celular: '',
      correoPersonal: '',
      correoInstitucional: '',
      direccion: '',
      fotoBase64: '',
      foto: '',
      descripcion: '',
      cursosDictados: '',
      horariosDisponibles: ''
    });
    setError('');
    onClose();
  }, [onClose]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // ---- LOGIN ----
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!dni.trim()) {
      setError('Ingresa tu DNI.');
      return;
    }

    setLoading(true);
    setError('');

    // Busca en colección 'admins'
    try {
      const q = query(collection(db, 'admins'), where('dni', '==', dni.toUpperCase()));
      const snapshot = await getDocs(q);
      const admin = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];

      if (admin) {
        localStorage.setItem('userMode', 'admin');
        localStorage.setItem('dni', dni);
        onLogin('admin', dni);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error verificando admin:', err);
    }

    // Busca en docentes
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

  // ---- REGISTRO ----
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const formData = registerForm;

    if (!formData.nombre || !formData.correoPersonal || !formData.descripcion || !formData.dni) {
      setError('Completa los campos obligatorios: nombre, DNI, correo personal y descripción.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verifica si DNI ya existe
      const q = query(collection(db, 'docentes'), where('dni', '==', formData.dni));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setError('Este DNI ya está registrado. Usa el login.');
        setLoading(false);
        return;
      }

      const dataToSave = {
        ...formData,
        foto: formData.fotoBase64 || formData.foto || 'https://via.placeholder.com/320x320?text=Sin+Foto',
        createdAt: new Date()
      };
      delete dataToSave.fotoBase64;

      await addDoc(collection(db, 'docentes'), dataToSave);

      // Limpia form y cambia a login
      setRegisterForm({
        nombre: '',
        fechaNacimiento: '',
        dni: '',
        celular: '',
        correoPersonal: '',
        correoInstitucional: '',
        direccion: '',
        fotoBase64: '',
        foto: '',
        descripcion: '',
        cursosDictados: '',
        horariosDisponibles: ''
      });
      setActiveTab('login');
      setError('');
      alert('¡Registro exitoso! Ahora inicia sesión con tu DNI.');
    } catch (err) {
      setError('Error al registrarse. Intenta de nuevo.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleRegisterInputChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex justify-center items-center z-50 animate-fadeIn p-4">
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full mx-auto overflow-hidden border border-gray-200 transform transition-all duration-300 hover:scale-[1.02] max-h-[90vh] overflow-y-auto ${
          activeTab === 'register' ? 'max-w-lg sm:max-w-xl' : 'max-w-sm sm:max-w-md'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] px-4 sm:px-6 py-3 sm:py-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-5"></div>
          <div className="relative z-10">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-0.5">
              <FiUser size={18} className="sm:size-10" />
              <span>{activeTab === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</span>
            </h2>
            <p className="text-xs text-white/80 mt-1 hidden sm:block">
              {activeTab === 'login' ? 'Ingresa tu DNI para acceder' : 'Crea tu perfil como docente'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 py-2 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-3 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === 'login'
                  ? 'bg-[#4682B4] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-3 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === 'register'
                  ? 'bg-[#4682B4] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center space-x-0.5">
                  <FiUser size={16} className="sm:size-8" />
                  <span>DNI</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ej: 12345678"
                    className="w-full pl-8 pr-4 py-2.5 sm:py-3.5 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4682B4] focus:border-[#4682B4] transition-all duration-300 bg-gray-50 hover:bg-white text-sm sm:text-base"
                    maxLength="8"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl sm:rounded-2xl p-2 sm:p-3">
                  <p className="text-red-600 text-xs sm:text-sm text-center flex items-center justify-center space-x-0.5">
                    <FiLock size={16} className="sm:size-8" />
                    <span>{error}</span>
                  </p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] text-white py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:from-[#3A6FA1] hover:to-[#4682B4] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center space-x-0.5">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 border-b-2 border-white"></div>
                      <span className="text-sm sm:text-base">Verificando...</span>
                    </>
                  ) : (
                    <>
                      <FiLock size={16} className="sm:size-8" />
                      <span className="text-sm sm:text-base">Ingresar</span>
                    </>
                  )}
                </span>
              </button>
            </form>
          ) : (
            <div>
              <DocenteForm
                onSubmit={handleRegisterSubmit}
                formData={registerForm}
                onChange={handleRegisterInputChange}
                buttonText="Registrarse"
                setFormData={setRegisterForm}
              />
              {error && (
                <div className="mt-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl sm:rounded-2xl p-2 sm:p-3">
                  <p className="text-red-600 text-xs sm:text-sm text-center flex items-center justify-center space-x-0.5">
                    <FiLock size={16} className="sm:size-8" />
                    <span>{error}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalLogin;