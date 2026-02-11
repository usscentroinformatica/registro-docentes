// src/components/ModalLogin.jsx
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
    correoPersonalUser: '',
    correoPersonalDomain: 'gmail.com',
    correoPersonal: '',
    carreraProfesional: '',
    gradoAcademico: '',
    maestriaEn: '',
    doctoradoEn: '',
    correoInstitucional: '',
    direccion: '',
    genero: '',
    fotoBase64: '',
    foto: '',
    descripcion: '',
    cursosDictados: [],
    horariosDisponibles: ''
  });

  const handleClose = useCallback(() => {
    setDni('');
    setRegisterForm({
      nombre: '',
      fechaNacimiento: '',
      dni: '',
      celular: '',
      correoPersonalUser: '',
      correoPersonalDomain: 'gmail.com',
      correoPersonal: '',
      carreraProfesional: '',
      gradoAcademico: '',
      maestriaEn: '',
      doctoradoEn: '',
      correoInstitucional: '',
      direccion: '',
      genero: '',
      fotoBase64: '',
      foto: '',
      descripcion: '',
      cursosDictados: [],
      horariosDisponibles: ''
    });
    setError('');
    onClose();
  }, [onClose]);

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!dni.trim()) {
      setError('Ingresa tu DNI.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'admins'), where('dni', '==', dni.toUpperCase()));
      const snapshot = await getDocs(q);
      const admin = snapshot.docs[0];

      if (admin) {
        localStorage.setItem('userMode', 'admin');
        localStorage.setItem('dni', dni);
        localStorage.setItem('userId', admin.id); // ⭐ AGREGADO PARA ADMINS
        onLogin('admin', dni);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error verificando admin:', err);
    }

    try {
      const q = query(collection(db, 'docentes'), where('dni', '==', dni));
      const snapshot = await getDocs(q);
      const docente = snapshot.docs[0];

      if (docente) {
        localStorage.setItem('userMode', 'docente');
        localStorage.setItem('dni', dni);
        localStorage.setItem('userId', docente.id); // ⭐ AGREGADO PARA DOCENTES
        onLogin('docente', { id: docente.id, ...docente.data() });
      } else {
        setError('DNI no encontrado. Verifica o contacta al administrador.');
      }
    } catch (err) {
      setError('Error al verificar DNI. Intenta de nuevo.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async (e, dataToSave) => {
    e.preventDefault();
    
    // Si viene de DocenteForm (con dataToSave), usamos eso
    const formData = dataToSave || registerForm;

    if (!formData.nombre || !formData.correoPersonal || !formData.descripcion || !formData.dni) {
      setError('Completa los campos obligatorios: nombre, DNI, correo personal y descripción.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'docentes'), where('dni', '==', formData.dni));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setError('Este DNI ya está registrado. Usa el login.');
        setLoading(false);
        return;
      }

      const finalData = {
        ...formData,
        foto: formData.fotoBase64 || formData.foto || 'https://via.placeholder.com/320x320?text=Sin+Foto',
        createdAt: new Date()
      };
      delete finalData.fotoBase64;
      delete finalData.fotoFile;
      delete finalData.correoPersonalUser;
      delete finalData.correoPersonalDomain;

      await addDoc(collection(db, 'docentes'), finalData);

      setRegisterForm({
        nombre: '',
        fechaNacimiento: '',
        dni: '',
        celular: '',
        correoPersonalUser: '',
        correoPersonalDomain: 'gmail.com',
        correoPersonal: '',
        carreraProfesional: '',
        gradoAcademico: '',
        maestriaEn: '',
        doctoradoEn: '',
        correoInstitucional: '',
        direccion: '',
        genero: '',
        fotoBase64: '',
        foto: '',
        descripcion: '',
        cursosDictados: [],
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 transform transition-all duration-300 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] px-6 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FiUser size={20} />
              <span>{activeTab === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</span>
            </h2>
            <p className="text-sm text-white/90 mt-2">
              {activeTab === 'login' ? 'Ingresa tu DNI para acceder' : 'Crea tu perfil como docente'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'login'
                  ? 'bg-white text-[#4682B4] shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'register'
                  ? 'bg-white text-[#4682B4] shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6 flex flex-col items-center">
              <div className="flex flex-col items-center">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FiUser className="text-gray-500" size={16} />
                  <span>DNI</span>
                </label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ej: 12345678"
                  className="w-full max-w-xs px-4 py-3 border-2 border-[#4682B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4682B4]/30 bg-gray-50 hover:bg-white transition-all"
                  maxLength="8"
                />
              </div>

              {error && (
                <div className="w-full max-w-xs bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-600 text-sm flex items-center justify-center gap-1.5">
                    <FiLock size={16} />
                    <span>{error}</span>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full max-w-xs bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] text-white py-3 rounded-xl font-semibold hover:from-[#3A6FA1] hover:to-[#4682B4] disabled:opacity-60 transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Verificando...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiLock size={16} />
                    <span>Ingresar</span>
                  </span>
                )}
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
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-600 text-sm flex items-center justify-center gap-1.5">
                    <FiLock size={16} />
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
