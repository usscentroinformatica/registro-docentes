// src/App.js (actualizaciones necesarias)
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore'; // Agregado doc y updateDoc
import { db } from './firebase';
import { FiSearch } from 'react-icons/fi';
import ModalDocente from './components/ModalDocente';
import ModalAgregarDocente from './components/ModalAgregarDocente';
import ResultadosBusqueda from './components/ResultadosBusqueda';
import ModalLogin from './components/ModalLogin';
import ModalEditarDocente from './components/ModalEditarDocente'; // Nueva importación
import Header from './components/Header';

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
    direccion: '',
    fotoBase64: '',
    foto: '',
    descripcion: '',
    cursosDictados: ''
  });
  const [loading, setLoading] = useState(false);
  const [modalDocente, setModalDocente] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Nuevo estado para modal de edición
  const [userMode, setUserMode] = useState(localStorage.getItem('userMode') || null);
  const [showLoginModal, setShowLoginModal] = useState(!userMode);
  const [docentePerfil, setDocentePerfil] = useState(null);

  useEffect(() => {
    if (userMode) {
      cargarDocentes();
    }
  }, [userMode]);

  useEffect(() => {
    if (userMode !== 'admin') {
      setResultados([]);
      return;
    }

    if (searchQuery.trim().length === 0) {
      setResultados(docentes);
      return;
    }

    const matches = docentes.filter(docente =>
      docente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docente.correoPersonal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docente.correoInstitucional?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setResultados(matches);
  }, [searchQuery, docentes, userMode]);

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

  // Nueva función para editar perfil
  const editarDocente = async (e, docenteId) => {
    e.preventDefault();
    if (!formData.nombre || !formData.correoPersonal || !formData.descripcion) {
      alert('Completa los campos obligatorios.');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        foto: formData.fotoBase64 || formData.foto || 'https://via.placeholder.com/320x320?text=Sin+Foto',
        updatedAt: new Date()
      };
      delete dataToSave.fotoBase64;

      const docRef = doc(db, 'docentes', docenteId);
      await updateDoc(docRef, dataToSave);

      // Actualizar el perfil local
      setDocentePerfil({ ...docentePerfil, ...dataToSave });

      // Limpiar formData
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

      alert('¡Perfil actualizado exitosamente!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar.');
    }
  };

  const handleLogin = async (mode, data) => {
    setUserMode(mode);
    if (mode === 'docente') {
      setDocentePerfil(data);
    }
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userMode');
    localStorage.removeItem('dni');
    setUserMode(null);
    setDocentePerfil(null);
    setModalDocente(null);
    setSearchQuery('');
    setResultados([]);
    setShowLoginModal(true);
  };

  const abrirAgregarModal = () => {
    if (userMode !== 'admin') {
      alert('Solo administradores pueden agregar docentes.');
      return;
    }
    setShowAddModal(true);
  };

  // Actualizada función para editar
  const abrirEditarModal = () => {
    if (userMode !== 'docente' || !docentePerfil) {
      alert('No disponible en este modo.');
      return;
    }
    // Precargar formData con los datos del perfil
    setFormData({ ...docentePerfil, fotoBase64: '' });
    setShowEditModal(true);
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

  // Nueva función para cerrar modal de edición
  const cerrarEditarModal = () => {
    setShowEditModal(false);
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

  const cerrarModal = () => {
    setModalDocente(null);
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No especificada';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad > 0 ? `${edad} años` : 'Edad no válida';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <>
      <ModalLogin isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />

      {userMode && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative animate-fadeIn">
          <Header
            userMode={userMode}
            docentePerfil={docentePerfil}
            onLogout={handleLogout}
            onEditPerfil={abrirEditarModal}
            onAgregarDocente={abrirAgregarModal}
          />

          {userMode === 'admin' ? (
            <>
              <div className="max-w-4xl mx-auto px-4 pt-20">
                <div className="relative mb-6">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    placeholder="Escribe el nombre o email del docente... (filtra en tiempo real)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-12"
                  />
                </div>

                <ResultadosBusqueda
                  resultados={resultados}
                  onSeleccionarDocente={(docente) => setModalDocente(docente)}
                />
              </div>
            </>
          ) : userMode === 'docente' && docentePerfil ? (
            <div className="max-w-4xl mx-auto px-4 pt-20">
              <div className="bg-slate-100 p-10 rounded-xl shadow-2xl border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Detalles Personales</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Nombre completo</label>
                      <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.nombre}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Fecha de nacimiento</label>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.fechaNacimiento || 'No especificada'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Edad</label>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 font-medium">
                        {calcularEdad(docentePerfil.fechaNacimiento)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">DNI</label>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.dni || 'No especificado'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Número de celular</label>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.celular || 'No especificado'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Correo personal</label>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.correoPersonal || 'No especificado'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Correo institucional</label>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.correoInstitucional || 'No especificado'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Dirección</label>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.direccion || 'No especificada'}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Descripción</label>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">{docentePerfil.descripcion}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Cursos dictados en USS</label>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">{docentePerfil.cursosDictados || 'No especificados'}</p>
                    </div>
                  </div>
                  <div className="flex items-start justify-center">
                    <div className="text-center">
                      <img
                        src={docentePerfil.foto}
                        alt={docentePerfil.nombre}
                        className="w-80 h-80 object-cover rounded-xl shadow-md border border-gray-200 mx-auto"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/320x320?text=Sin+Foto';
                        }}
                      />
                      <p className="text-sm text-gray-500 mt-3 font-medium">Foto de perfil</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {userMode === 'admin' && (
            <>
              <ModalDocente docente={modalDocente} onClose={cerrarModal} />
              <ModalAgregarDocente
                isOpen={showAddModal}
                onClose={cerrarAgregarModal}
                onSubmit={agregarDocente}
                formData={formData}
                onChange={handleInputChange}
                setFormData={setFormData}
              />
            </>
          )}

          {/* Nuevo modal para edición de perfil (solo en modo docente) */}
          {userMode === 'docente' && (
            <ModalEditarDocente
              isOpen={showEditModal}
              onClose={cerrarEditarModal}
              onSubmit={(e) => editarDocente(e, docentePerfil.id)}
              formData={formData}
              onChange={handleInputChange}
              setFormData={setFormData}
            />
          )}
        </div>
      )}
    </>
  );
}

export default App;