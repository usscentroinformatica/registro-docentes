// src/App.js (actualizado: URLs corregidas + filtrado de undefined para Firebase)
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { FiSearch } from 'react-icons/fi';
import ModalDocente from './components/ModalDocente';
import ModalAgregarDocente from './components/ModalAgregarDocente';
import ResultadosBusqueda from './components/ResultadosBusqueda';
import ModalLogin from './components/ModalLogin';
import ModalEditarDocente from './components/ModalEditarDocente';
import Header from './components/Header';
import Toast from './components/Toast';
import CalendarioView from './components/CalendarioView';

// ✅ Constante global para placeholder
const PLACEHOLDER_IMAGE = 'https://placehold.co/320x320?text=Sin+Foto';

// ✅ Función para limpiar datos undefined/null antes de enviar a Firebase
const cleanDataForFirebase = (data) => {
  const cleaned = {};
  Object.entries(data).forEach(([key, value]) => {
    // Solo incluir valores que NO sean undefined o null
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

function AppContent() {
  const navigate = useNavigate();
  const [docentes, setDocentes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    fechaNacimiento: '',
    dni: '',
    celular: '',
    correoPersonalUser: '',
    correoPersonalDomain: 'gmail.com',
    correoInstitucional: '',
    gradoAcademico: '',
    magisterEn: '',
    doctoradoEn: '',
    genero: '',
    direccion: '',
    fotoBase64: '',
    foto: '',
    descripcion: '',
    cursosDictados: [],
    horariosDisponibles: ''
  });
  const [loading, setLoading] = useState(false);
  const [modalDocente, setModalDocente] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocenteForEdit, setSelectedDocenteForEdit] = useState(null);
  const [userMode, setUserMode] = useState(localStorage.getItem('userMode') || null);
  const [showLoginModal, setShowLoginModal] = useState(!userMode);
  const [docentePerfil, setDocentePerfil] = useState(() => {
    if (userMode === 'docente') {
      try {
        const stored = localStorage.getItem('docentePerfil');
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error('Error parsing stored docentePerfil:', error);
        return null;
      }
    }
    return null;
  });
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userMode');
    localStorage.removeItem('dni');
    localStorage.removeItem('docentePerfil');
    localStorage.removeItem('dniDocente');
    setUserMode(null);
    setDocentePerfil(null);
    setModalDocente(null);
    setSelectedDocenteForEdit(null);
    setSearchQuery('');
    setResultados([]);
    setShowLoginModal(true);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (userMode === 'docente' && !docentePerfil) {
      const dni = localStorage.getItem('dniDocente');
      if (dni) {
        const fetchPerfil = async () => {
          try {
            const q = query(collection(db, 'docentes'), where('dni', '==', dni));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const docData = snapshot.docs[0].data();
              const perfil = { id: snapshot.docs[0].id, ...docData };
              setDocentePerfil(perfil);
              localStorage.setItem('docentePerfil', JSON.stringify(perfil));
            } else {
              handleLogout();
              showToast('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            handleLogout();
            showToast('Error al cargar perfil. Por favor, inicia sesión nuevamente.', 'error');
          }
        };
        fetchPerfil();
      } else {
        handleLogout();
      }
    }
  }, [userMode, docentePerfil, handleLogout, showToast]);

  useEffect(() => {
    if (userMode) cargarDocentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (e.target.name === 'cursosDictados') {
      setFormData({ ...formData, cursosDictados: e.target.value });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const agregarDocente = async (e, dataToSave) => {
    e.preventDefault();
    // Solo validar campos obligatorios en registro
    if (!dataToSave.nombre || !dataToSave.correoPersonal || !dataToSave.descripcion) {
      showToast('Completa los campos obligatorios.', 'error');
      return;
    }

    try {
      // ✅ Preparar datos con foto por defecto si no hay
      const dataPreparada = {
        ...dataToSave,
        foto: dataToSave.fotoBase64 || dataToSave.foto || PLACEHOLDER_IMAGE,
        createdAt: new Date()
      };
      
      // ✅ Eliminar campos que no deben ir a Firebase
      delete dataPreparada.fotoBase64;
      delete dataPreparada.fotoFile;
      
      // ✅ Limpiar undefined/null
      const dataFinal = cleanDataForFirebase(dataPreparada);

      await addDoc(collection(db, 'docentes'), dataFinal);
      
      setFormData({
        nombre: '',
        fechaNacimiento: '',
        dni: '',
        celular: '',
        correoPersonalUser: '',
        correoPersonalDomain: 'gmail.com',
        correoInstitucional: '',
        gradoAcademico: '',
        magisterEn: '',
        doctoradoEn: '',
        genero: '',
        direccion: '',
        fotoBase64: '',
        foto: '',
        descripcion: '',
        cursosDictados: [],
        horariosDisponibles: ''
      });
      
      cargarDocentes();
      showToast('¡Docente agregado exitosamente!', 'success');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error al agregar docente:', error);
      showToast('Error al agregar docente: ' + error.message, 'error');
    }
  };

  const editarDocenteGen = async (e, dataToSave, targetDocenteId) => {
    e.preventDefault();
    // Al editar, NO validar campos obligatorios. Permitir actualizar cualquier campo.

    try {
      // ✅ DEPURACIÓN: Ver qué datos llegan
      console.log('🔍 Datos recibidos para edición:', dataToSave);
      
      // ✅ Preparar datos con foto por defecto si no hay
      const dataPreparada = {
        ...dataToSave,
        foto: dataToSave.fotoBase64 || dataToSave.foto || PLACEHOLDER_IMAGE,
        updatedAt: new Date()
      };
      
      // ✅ LISTA COMPLETA de campos a eliminar
      const camposAEliminar = [
        'fotoBase64', 
        'fotoFile', 
        'id', 
        'createdAt'
      ];
      
      camposAEliminar.forEach(campo => {
        delete dataPreparada[campo];
      });
      
      // ✅ Limpiar undefined/null de forma más agresiva
      const dataFinal = {};
      Object.entries(dataPreparada).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          dataFinal[key] = value;
        }
      });
      
      console.log('✅ Datos finales a enviar a Firebase:', dataFinal);

      const docRef = doc(db, 'docentes', targetDocenteId);
      await updateDoc(docRef, dataFinal);

      // Si es el perfil propio (docente logueado), actualiza localStorage
      if (userMode === 'docente' && targetDocenteId === docentePerfil.id) {
        const updatedPerfil = { ...docentePerfil, ...dataFinal };
        setDocentePerfil(updatedPerfil);
        localStorage.setItem('docentePerfil', JSON.stringify(updatedPerfil));
        showToast('¡Perfil actualizado exitosamente!', 'success');
      } else {
        showToast(`¡Perfil de ${dataToSave.nombre} actualizado exitosamente!`, 'success');
        cargarDocentes();
      }

      setFormData({
        nombre: '',
        fechaNacimiento: '',
        dni: '',
        celular: '',
        correoPersonalUser: '',
        correoPersonalDomain: 'gmail.com',
        correoInstitucional: '',
        gradoAcademico: '',
        magisterEn: '',
        doctoradoEn: '',
        genero: '',
        direccion: '',
        fotoBase64: '',
        foto: '',
        descripcion: '',
        cursosDictados: [],
        horariosDisponibles: ''
      });

      setShowEditModal(false);
      setSelectedDocenteForEdit(null);
    } catch (error) {
      console.error('Error al actualizar docente:', error);
      showToast('Error al actualizar: ' + error.message, 'error');
    }
  };

  const editarDocente = async (e, dataToSave) => {
    editarDocenteGen(e, dataToSave, docentePerfil.id);
  };

  const editarDocenteAdmin = async (e, dataToSave) => {
    if (!selectedDocenteForEdit?.id) {
      showToast('Error: No se seleccionó un docente para editar.', 'error');
      return;
    }
    editarDocenteGen(e, dataToSave, selectedDocenteForEdit.id);
  };

  const handleLogin = async (mode, data) => {
    setUserMode(mode);
    localStorage.setItem('userMode', mode);
    if (mode === 'docente') {
      setDocentePerfil(data);
      localStorage.setItem('docentePerfil', JSON.stringify(data));
      localStorage.setItem('dniDocente', data.dni || '');
    }
    setShowLoginModal(false);
    navigate('/');
  };

  const cerrarAgregarModal = () => {
    setShowAddModal(false);
    setFormData({
      nombre: '',
      fechaNacimiento: '',
      dni: '',
      celular: '',
      correoPersonalUser: '',
      correoPersonalDomain: 'gmail.com',
      correoInstitucional: '',
      gradoAcademico: '',
      magisterEn: '',
      doctoradoEn: '',
      genero: '',
      direccion: '',
      fotoBase64: '',
      foto: '',
      descripcion: '',
      cursosDictados: [],
      horariosDisponibles: ''
    });
  };

  const cerrarEditarModal = () => {
    setShowEditModal(false);
    setFormData({
      nombre: '',
      fechaNacimiento: '',
      dni: '',
      celular: '',
      correoPersonalUser: '',
      correoPersonalDomain: 'gmail.com',
      correoInstitucional: '',
      gradoAcademico: '',
      magisterEn: '',
      doctoradoEn: '',
      genero: '',
      direccion: '',
      fotoBase64: '',
      foto: '',
      descripcion: '',
      cursosDictados: [],
      horariosDisponibles: ''
    });
    setSelectedDocenteForEdit(null);
  };

  const cerrarModal = () => {
    setModalDocente(null);
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No especificada';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento + 'T00:00:00');
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad > 0 ? `${edad} años` : 'Edad no válida';
  };

  const abrirCalendario = () => {
    navigate('/calendario');
  };

  const onEditPerfil = () => {
    if (docentePerfil) {
      setFormData({
        ...docentePerfil,
        fotoBase64: ''
      });
    }
    setShowEditModal(true);
  };

  const abrirEditarDocente = (docenteSeleccionado) => {
    if (userMode !== 'admin') return;
    setSelectedDocenteForEdit(docenteSeleccionado);
    setFormData({
      ...docenteSeleccionado,
      fotoBase64: ''
    });
    setShowEditModal(true);
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
      <ModalLogin 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onLogin={handleLogin}
        onShowToast={showToast}
      />
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      )}

      {userMode && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 relative animate-fadeIn">
          <Header
            userMode={userMode}
            docentePerfil={docentePerfil}
            onLogout={handleLogout}
            onEditPerfil={onEditPerfil}
            onAgregarDocente={() => setShowAddModal(true)}
            onCalendario={abrirCalendario}
          />

          <Routes>
            <Route
              path="/"
              element={
                userMode === 'admin' ? (
                  <div className="max-w-6xl mx-auto px-4 pt-20 sm:pt-24">
                    <div className="relative mb-6">
                      <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                      <input
                        type="text"
                        placeholder="Escribe el nombre o email del docente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <ResultadosBusqueda
                      resultados={resultados}
                      onSeleccionarDocente={(docente) => setModalDocente(docente)}
                      onEditarDocente={abrirEditarDocente}
                    />
                  </div>
                ) : userMode === 'docente' && docentePerfil ? (
                  <div className="max-w-4xl mx-auto px-4 pt-20 sm:pt-24">
                    <div className="bg-slate-100 p-4 sm:p-10 rounded-xl shadow-2xl border border-gray-200">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 text-center">Detalles Personales</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        <div className="space-y-4 sm:space-y-6">
                          {/* Nombre completo */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Nombre completo</label>
                            <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.nombre}</p>
                          </div>
                          {/* Fecha de nacimiento */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Fecha de nacimiento</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.fechaNacimiento || 'No especificada'}</p>
                          </div>
                          {/* Edad */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Edad</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 font-medium">
                              {calcularEdad(docentePerfil.fechaNacimiento)}
                            </p>
                          </div>
                          {/* DNI */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">DNI</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.dni || 'No especificado'}</p>
                          </div>
                          {/* Celular */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Número de celular</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.celular || 'No especificado'}</p>
                          </div>
                          {/* Correo personal */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Correo personal</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.correoPersonal || 'No especificado'}</p>
                          </div>
                          {/* Correo institucional */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Correo institucional</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.correoInstitucional || 'No especificado'}</p>
                          </div>
                          {/* Dirección */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Dirección</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.direccion || 'No especificada'}</p>
                          </div>
                          {/* Grado académico */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Grado académico</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.gradoAcademico || 'No especificado'}</p>
                          </div>
                          {/* Magíster en... */}
                          {docentePerfil.gradoAcademico === 'Magíster' && (
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">Magíster en...</label>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.magisterEn || 'No especificado'}</p>
                            </div>
                          )}
                          {/* Doctorado en... */}
                          {docentePerfil.gradoAcademico === 'Doctor' && (
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">Doctorado en...</label>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.doctoradoEn || 'No especificado'}</p>
                            </div>
                          )}
                          {/* Género */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Género</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docentePerfil.genero || 'No especificado'}</p>
                          </div>
                          {/* Cursos dictados */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Cursos</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">
                              {Array.isArray(docentePerfil.cursosDictados) && docentePerfil.cursosDictados.length > 0
                                ? docentePerfil.cursosDictados.join(', ')
                                : 'No especificados'}
                            </p>
                          </div>
                          {/* Horarios disponibles */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <span className="text-amber-600">📅</span>
                              Horarios Disponibles - Ciclo Intensivo Noviembre
                            </label>
                            <p className="text-sm text-gray-600 bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border-2 border-amber-200 whitespace-pre-wrap leading-relaxed">
                              {docentePerfil.horariosDisponibles || 'No especificados'}
                            </p>
                          </div>
                          {/* Descripción */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Descripción</label>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">{docentePerfil.descripcion}</p>
                          </div>
                        </div>
                        <div className="flex items-start justify-center">
                          <div className="text-center">
                            <img
                              src={docentePerfil.foto || PLACEHOLDER_IMAGE}
                              alt={docentePerfil.nombre}
                              className="w-48 h-48 sm:w-80 sm:h-80 object-contain bg-gray-50 rounded-xl shadow-md border border-gray-200 mx-auto"
                              onError={(e) => {
                                e.target.src = PLACEHOLDER_IMAGE;
                              }}
                            />
                            <p className="text-sm text-gray-500 mt-3 font-medium">Foto de perfil</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto px-4 pt-20 sm:pt-24 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando perfil...</p>
                  </div>
                )
              }
            />

            <Route path="/calendario" element={<CalendarioView docentes={docentes} />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {userMode === 'admin' && (
            <>
              <ModalDocente 
                docente={modalDocente} 
                onClose={cerrarModal} 
                onEditar={abrirEditarDocente}
              />
              <ModalAgregarDocente
                isOpen={showAddModal}
                onClose={cerrarAgregarModal}
                onSubmit={agregarDocente}
                formData={formData}
                onChange={handleInputChange}
                setFormData={setFormData}
                buttonText="Agregar Docente"
              />
              <ModalEditarDocente
                isOpen={showEditModal}
                onClose={cerrarEditarModal}
                onSubmit={editarDocenteAdmin}
                formData={formData}
                onChange={handleInputChange}
                setFormData={setFormData}
                docente={selectedDocenteForEdit}
                title="Editar Docente"
                subtitle="Modifica los datos del docente seleccionado"
              />
            </>
          )}

          {userMode === 'docente' && (
            <ModalEditarDocente
              isOpen={showEditModal}
              onClose={cerrarEditarModal}
              onSubmit={editarDocente}
              formData={formData}
              onChange={handleInputChange}
              setFormData={setFormData}
              docente={docentePerfil}
              title="Editar Mi Perfil"
              subtitle="Modifica tus datos personales"
            />
          )}
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
