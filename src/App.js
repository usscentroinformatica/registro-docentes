// src/App.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { FiSearch, FiPlus } from 'react-icons/fi';
import ModalDocente from './components/ModalDocente';
import ModalAgregarDocente from './components/ModalAgregarDocente';
import ResultadosBusqueda from './components/ResultadosBusqueda';

function App() {
  const [docentes, setDocentes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    fechaNacimiento: '',
    dni: '',
    celular: '',
    correoPersonal: '',
    correoInstitucional: '',
    direccion: '', // Nuevo campo
    fotoBase64: '',
    foto: '',
    descripcion: '',
    cursosDictados: '' // Nuevo campo
  });
  const [loading, setLoading] = useState(false);
  const [modalDocente, setModalDocente] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    cargarDocentes();
  }, []);

  // Búsqueda en tiempo real
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setResultados([]);
      return;
    }

    const matches = docentes.filter(docente =>
      docente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docente.correoPersonal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docente.correoInstitucional?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setResultados(matches);
  }, [searchQuery, docentes]);

  const cargarDocentes = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'docentes'));
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocentes(lista);
    } catch (error) {
      console.error('Error cargando docentes:', error);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const agregarDocente = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.correoPersonal || !formData.descripcion) {
      alert('Completa los campos obligatorios.');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        foto: formData.fotoBase64 || formData.foto || 'https://via.placeholder.com/320x320?text=Sin+Foto',
        createdAt: new Date()
      };
      delete dataToSave.fotoBase64;

      await addDoc(collection(db, 'docentes'), dataToSave);
      setFormData({
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
        cursosDictados: ''
      });
      cargarDocentes();
      alert('¡Docente agregado exitosamente!');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al agregar.');
    }
  };

  const handleBuscar = () => {
    // Redundante con useEffect, pero se mantiene
  };

  const seleccionarDocente = (docente) => {
    setModalDocente(docente);
  };

  const cerrarModal = () => {
    setModalDocente(null);
  };

  const abrirAgregarModal = () => {
    setShowAddModal(true);
  };

  const cerrarAgregarModal = () => {
    setShowAddModal(false);
    setFormData({
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
      cursosDictados: ''
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8 relative animate-fadeIn">
      {/* Botón flotante superior derecha */}
      <button
        onClick={abrirAgregarModal}
        className="fixed top-6 right-6 bg-blue-800 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center space-x-2"
      >
        <FiPlus size={20} />
        <span className="hidden sm:inline font-medium">Agregar</span>
      </button>

      <div className="max-w-4xl mx-auto px-4 pt-24">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Buscar Docente</h1>

        {/* Input con icono moderno */}
        <div className="relative mb-6">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Escribe el nombre o email del docente... (busca al instante)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
        </div>

        {/* Botón buscar */}
        <button
          onClick={handleBuscar}
          className="w-full btn-primary flex items-center justify-center space-x-2 mb-6"
        >
          <FiSearch size={20} />
          <span>Buscar</span>
        </button>

        {/* Lista de resultados */}
        {searchQuery.trim().length > 0 && (
          <ResultadosBusqueda
            resultados={resultados}
            onSeleccionarDocente={seleccionarDocente}
          />
        )}
      </div>

      {/* Modales */}
      <ModalDocente docente={modalDocente} onClose={cerrarModal} />
      <ModalAgregarDocente
        isOpen={showAddModal}
        onClose={cerrarAgregarModal}
        onSubmit={agregarDocente}
        formData={formData}
        onChange={handleInputChange}
        setFormData={setFormData}
      />
    </div>
  );
}

export default App;