// src/components/ModalAsignarCurso.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiUserCheck, FiSend, FiPlus, FiTrash2, FiMail, FiBook, FiDatabase, FiChevronDown } from 'react-icons/fi';
import emailjs from '@emailjs/browser';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ModalAsignarCurso = ({ docentes, onClose, onAsignacionCompletada }) => {
  const [asignacionesPorSeccion, setAsignacionesPorSeccion] = useState({});
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [periodoAcademico, setPeriodoAcademico] = useState('2026-I');
  const [enviandoCorreos, setEnviandoCorreos] = useState(false);
  const [filtroNombre, setFiltroNombre] = useState('');
  
  // Estados para cursos y asignaciones
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [modoEdicionCurso, setModoEdicionCurso] = useState(false);
  const [cursoEditando, setCursoEditando] = useState(null);
  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: '',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: []
  });
  
  // Estado para crear secciones PEAD manualmente
  const [mostrarFormularioSeccion, setMostrarFormularioSeccion] = useState(false);
  const [nuevaSeccionPEAD, setNuevaSeccionPEAD] = useState({
    letra: 'a', // Letra de la sección: a, b, c, d, etc.
    turno: 'MAÑANA',
    dias: 'LUNES Y MIÉRCOLES',
    horario: '08:00 AM - 11:00 AM',
    enlace: ''
  });
  
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  // CARGAR TODOS LOS CURSOS DESDE LA COLECCIÓN "cursos" DE FIREBASE
  useEffect(() => {
    const cargarCursosDesdeFirebase = async () => {
      try {
        setCargando(true);
        setErrorCarga(null);
        
        console.log('🔄 Iniciando carga de cursos desde Firebase...');
        
        // Obtener referencia a la colección "cursos"
        const cursosRef = collection(db, 'cursos');
        
        // Obtener todos los documentos de la colección
        const querySnapshot = await getDocs(cursosRef);
        
        console.log(`📊 Total documentos en colección 'cursos': ${querySnapshot.size}`);
        
        if (querySnapshot.empty) {
          console.log('⚠️ La colección "cursos" está vacía');
          setCursosDisponibles([]);
        } else {
          // Convertir documentos a array de cursos
          const cursosArray = [];
          
          querySnapshot.forEach((doc) => {
            const cursoData = doc.data();
            console.log(`📄 Documento ID: ${doc.id}`, cursoData);
            
            cursosArray.push({
              id: doc.id, // ID del documento en Firebase
              firestoreId: doc.id,
              nombre: cursoData.nombre || 'Sin nombre',
              modalidad: cursoData.modalidad || 'VIRTUAL',
              lugar: cursoData.lugar || 'AULA USS - ZOOM',
              secciones: Array.isArray(cursoData.secciones) ? cursoData.secciones : [],
              // Mantener cualquier otro campo que pueda tener el documento
              ...cursoData
            });
          });
          
          // Ordenar alfabéticamente por nombre
          const cursosOrdenados = cursosArray.sort((a, b) => 
            a.nombre.localeCompare(b.nombre)
          );
          
          console.log('✅ Cursos cargados exitosamente:', cursosOrdenados.length);
          console.log('📋 Lista completa de cursos:');
          cursosOrdenados.forEach((curso, index) => {
            console.log(`${index + 1}. ${curso.nombre} (ID: ${curso.id}) - ${curso.secciones?.length || 0} secciones`);
          });
          
          setCursosDisponibles(cursosOrdenados);
        }
      } catch (error) {
        console.error('❌ ERROR CRÍTICO al cargar cursos:', error);
        setErrorCarga(`Error al cargar cursos: ${error.message}`);
        setCursosDisponibles([]);
      } finally {
        setCargando(false);
      }
    };

    cargarCursosDesdeFirebase();
  }, []);

  // Inicializar EmailJS
  useEffect(() => {
    emailjs.init('MhLednlk47LyghD7y');
  }, []);

  // Obtener el curso seleccionado completo
  const cursoCompleto = cursosDisponibles.find(c => c.nombre === cursoSeleccionado);

  // Filtrar docentes por nombre
  const docentesFiltrados = filtroNombre 
    ? docentes.filter(docente => 
        docente.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      )
    : docentes;

  // AGREGAR SECCIÓN PEAD MANUALMENTE
  const agregarSeccionPEAD = async () => {
    if (!cursoCompleto || !nuevaSeccionPEAD.letra.trim()) {
      alert('Por favor ingresa una letra para la sección PEAD');
      return;
    }

    const letra = nuevaSeccionPEAD.letra.toLowerCase();
    const seccionNombre = `PEAD ${letra}`;
    const seccionId = `${cursoCompleto.id}_pead_${letra}`;
    
    const nuevaSeccion = {
      id: seccionId,
      seccion: seccionNombre,
      turno: nuevaSeccionPEAD.turno,
      dias: nuevaSeccionPEAD.dias,
      horario: nuevaSeccionPEAD.horario,
      horarioCompleto: `${nuevaSeccionPEAD.dias} ${nuevaSeccionPEAD.horario}`,
      enlace: nuevaSeccionPEAD.enlace || ''
    };

    // Verificar si ya existe una sección con esta letra
    const seccionesExistentes = cursoCompleto.secciones || [];
    if (seccionesExistentes.some(s => s.seccion.toLowerCase() === seccionNombre.toLowerCase())) {
      alert(`Ya existe una sección ${seccionNombre} para este curso`);
      return;
    }

    try {
      // Actualizar en Firestore
      const seccionesActualizadas = [...seccionesExistentes, nuevaSeccion];
      
      await updateDoc(doc(db, 'cursos', cursoCompleto.id), {
        secciones: seccionesActualizadas
      });

      // Actualizar estado local
      setCursosDisponibles(prev => 
        prev.map(c => c.id === cursoCompleto.id ? { ...c, secciones: seccionesActualizadas } : c)
      );

      // Resetear formulario
      setNuevaSeccionPEAD({
        letra: obtenerSiguienteLetra(cursoCompleto),
        turno: 'MAÑANA',
        dias: 'LUNES Y MIÉRCOLES',
        horario: '08:00 AM - 11:00 AM',
        enlace: ''
      });
      
      setMostrarFormularioSeccion(false);
      
      alert(`✅ Sección ${seccionNombre} agregada exitosamente`);
    } catch (error) {
      console.error('Error agregando sección PEAD:', error);
      alert('❌ Error al agregar sección: ' + error.message);
    }
  };

  // Obtener la siguiente letra disponible (a, b, c, d...)
  const obtenerSiguienteLetra = (curso) => {
    const secciones = curso.secciones || [];
    if (secciones.length === 0) {
      return 'a';
    }
    
    // Extraer letras existentes
    const letrasExistentes = secciones
      .map(s => {
        const match = s.seccion.match(/PEAD\s+(\w)/i);
        return match ? match[1].toLowerCase() : null;
      })
      .filter(l => l !== null);
    
    // Si no hay letras, empezar con 'a'
    if (letrasExistentes.length === 0) return 'a';
    
    // Encontrar la siguiente letra
    const alfabeto = 'abcdefghijklmnopqrstuvwxyz';
    let letraIndex = 0;
    
    while (letraIndex < alfabeto.length) {
      const letra = alfabeto[letraIndex];
      if (!letrasExistentes.includes(letra)) {
        return letra;
      }
      letraIndex++;
    }
    
    // Si ya se usaron todas las letras, usar la última + número
    return `${alfabeto[letrasExistentes.length - 1]}${letrasExistentes.length + 1}`;
  };

  // ELIMINAR SECCIÓN PEAD
  const eliminarSeccionPEAD = async (seccionId, cursoId) => {
    if (!window.confirm('¿Está seguro de eliminar esta sección PEAD?')) return;

    try {
      const curso = cursosDisponibles.find(c => c.id === cursoId);
      if (!curso) return;

      const seccionesActuales = curso.secciones || [];
      const nuevasSecciones = seccionesActuales.filter(s => s.id !== seccionId);
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'cursos', cursoId), {
        secciones: nuevasSecciones
      });

      // Actualizar estado local
      setCursosDisponibles(prev => 
        prev.map(c => c.id === cursoId ? { ...c, secciones: nuevasSecciones } : c)
      );

      // Limpiar asignación si existe
      setAsignacionesPorSeccion(prev => {
        const nuevas = { ...prev };
        delete nuevas[seccionId];
        return nuevas;
      });

      alert('✅ Sección PEAD eliminada');
    } catch (error) {
      console.error('Error eliminando sección:', error);
      alert('❌ Error al eliminar sección: ' + error.message);
    }
  };

  // MANEJO DE CURSOS
  const agregarNuevoCurso = async () => {
    if (!nuevoCurso.nombre.trim()) {
      alert('El curso necesita un nombre');
      return;
    }

    // Verificar si ya existe
    if (cursosDisponibles.some(c => c.nombre.toLowerCase() === nuevoCurso.nombre.toLowerCase())) {
      alert('Ya existe un curso con ese nombre');
      return;
    }

    const cursoParaGuardar = {
      nombre: nuevoCurso.nombre,
      modalidad: nuevoCurso.modalidad,
      lugar: nuevoCurso.lugar,
      secciones: [],
      fechaCreacion: new Date().toISOString(),
      tipo: 'personalizado'
    };

    try {
      // Guardar en Firestore
      const docRef = await addDoc(collection(db, 'cursos'), cursoParaGuardar);
      const cursoConId = {
        ...cursoParaGuardar,
        id: docRef.id,
        firestoreId: docRef.id
      };
      
      setCursosDisponibles(prev => [...prev, cursoConId].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setCursoSeleccionado(cursoParaGuardar.nombre);
      setNuevoCurso({
        nombre: '',
        modalidad: 'VIRTUAL',
        lugar: 'AULA USS - ZOOM',
        secciones: []
      });
      setModoEdicionCurso(false);
      
      alert('✅ Curso creado exitosamente en Firebase');
    } catch (error) {
      console.error('Error guardando curso:', error);
      alert('❌ Error al crear curso: ' + error.message);
    }
  };

  const editarCurso = (curso) => {
    setCursoEditando(curso);
    setNuevoCurso({
      nombre: curso.nombre,
      modalidad: curso.modalidad || 'VIRTUAL',
      lugar: curso.lugar || 'AULA USS - ZOOM',
      secciones: [...(curso.secciones || [])]
    });
    setModoEdicionCurso(true);
  };

  const actualizarCurso = async () => {
    if (!cursoEditando) return;

    const cursoActualizado = {
      ...cursoEditando,
      ...nuevoCurso,
      fechaActualizacion: new Date().toISOString()
    };

    try {
      // Actualizar en Firestore
      await updateDoc(doc(db, 'cursos', cursoEditando.id), cursoActualizado);
      
      const cursosActualizados = cursosDisponibles
        .map(c => c.id === cursoEditando.id ? cursoActualizado : c)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      setCursosDisponibles(cursosActualizados);
      setCursoSeleccionado(cursoActualizado.nombre);
      setCursoEditando(null);
      setNuevoCurso({ nombre: '', modalidad: 'VIRTUAL', lugar: 'AULA USS - ZOOM', secciones: [] });
      setModoEdicionCurso(false);
      
      alert('✅ Curso actualizado');
    } catch (error) {
      console.error('Error actualizando curso:', error);
      alert('❌ Error al actualizar curso: ' + error.message);
    }
  };

  const eliminarCurso = async (cursoId) => {
    if (!window.confirm('¿Está seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Eliminar de Firestore
      await deleteDoc(doc(db, 'cursos', cursoId));
      
      const curso = cursosDisponibles.find(c => c.id === cursoId);
      setCursosDisponibles(prev => prev.filter(c => c.id !== cursoId));
      if (cursoSeleccionado === curso?.nombre) {
        setCursoSeleccionado('');
      }
      
      alert('✅ Curso eliminado');
    } catch (error) {
      console.error('Error eliminando curso:', error);
      alert('❌ Error al eliminar curso: ' + error.message);
    }
  };

  // FUNCIÓN DE ASIGNACIÓN
  const asignarDocenteASeccion = (seccionId, docente) => {
    setAsignacionesPorSeccion(prev => {
      const nuevasAsignaciones = { ...prev };
      
      // Si el docente ya está asignado a otra sección del mismo curso, quitarlo
      Object.keys(nuevasAsignaciones).forEach(key => {
        if (nuevasAsignaciones[key]?.id === docente.id && key !== seccionId) {
          delete nuevasAsignaciones[key];
        }
      });
      
      nuevasAsignaciones[seccionId] = docente;
      return nuevasAsignaciones;
    });
  };

  const quitarDocenteDeSeccion = (seccionId) => {
    setAsignacionesPorSeccion(prev => {
      const nuevasAsignaciones = { ...prev };
      delete nuevasAsignaciones[seccionId];
      return nuevasAsignaciones;
    });
  };

  const getDocenteEnSeccion = (seccionId) => {
    return asignacionesPorSeccion[seccionId];
  };

  const estaDocenteAsignado = (docenteId) => {
    return Object.values(asignacionesPorSeccion).some(docente => docente?.id === docenteId);
  };

  // VALIDACIONES
  const validarAsignaciones = () => {
    if (!periodoAcademico.trim()) {
      alert('Por favor selecciona el período académico');
      return false;
    }
    
    if (!cursoSeleccionado) {
      alert('Por favor selecciona un curso');
      return false;
    }
    
    if (!cursoCompleto) {
      alert('Curso no encontrado');
      return false;
    }
    
    const secciones = cursoCompleto.secciones || [];
    
    if (secciones.length === 0) {
      return true;
    }
    
    if (Object.keys(asignacionesPorSeccion).length === 0) {
      alert('Por favor asigna al menos un docente a una sección');
      return false;
    }
    
    return true;
  };

  // GUARDAR ASIGNACIÓN
  const guardarAsignacion = () => {
    const secciones = cursoCompleto.secciones || [];
    const esCursoSinSecciones = secciones.length === 0;
    
    const asignacion = {
      id: `asig_${Date.now()}`,
      periodo: periodoAcademico,
      curso: cursoSeleccionado,
      fechaAsignacion: new Date().toISOString(),
      tipo: esCursoSinSecciones ? 'curso_sin_secciones' : 'curso_con_secciones',
      secciones: esCursoSinSecciones 
        ? [
            {
              seccionId: 'general',
              seccion: 'GENERAL',
              turno: 'NO ESPECIFICADO',
              dias: 'NO ESPECIFICADO',
              horario: 'NO ESPECIFICADO',
              horarioCompleto: 'NO ESPECIFICADO',
              enlace: '',
              modalidad: cursoCompleto?.modalidad || 'VIRTUAL',
              docente: Object.values(asignacionesPorSeccion)[0] || null
            }
          ]
        : Object.entries(asignacionesPorSeccion).map(([seccionId, docente]) => {
            const seccion = secciones.find(s => s.id === seccionId);
            return {
              seccionId,
              seccion: seccion?.seccion || 'Sin sección',
              turno: seccion?.turno || 'No especificado',
              dias: seccion?.dias || '',
              horario: seccion?.horario || '',
              horarioCompleto: seccion?.horarioCompleto || '',
              enlace: seccion?.enlace || '',
              modalidad: cursoCompleto?.modalidad || 'VIRTUAL',
              docente: {
                id: docente.id,
                nombre: docente.nombre,
                correoInstitucional: docente.correoInstitucional,
                correoPersonal: docente.correoPersonal,
                celular: docente.celular,
                dni: docente.dni
              }
            };
          }),
    };

    // Guardar en localStorage
    const asignacionesExistentes = JSON.parse(localStorage.getItem('asignacionesCursos') || '[]');
    asignacionesExistentes.push(asignacion);
    localStorage.setItem('asignacionesCursos', JSON.stringify(asignacionesExistentes));

    // Guardar en Firestore
    (async () => {
      try {
        await addDoc(collection(db, 'asignaciones'), asignacion);
        console.log('✅ Asignación guardada en Firestore');
      } catch (err) {
        console.error('❌ Error guardando en Firestore:', err);
      }
    })();

    return asignacion;
  };

  // ENVIAR CORREOS - CON ASUNTO CORREGIDO
const enviarCorreos = async () => {
  if (!validarAsignaciones()) return;
  
  setEnviandoCorreos(true);
  const resultados = [];

  try {
    const asignacion = guardarAsignacion();
    const esCursoSinSecciones = asignacion.tipo === 'curso_sin_secciones';
    
    const EMAILJS_CONFIG = {
      SERVICE_ID: 'service_4cy4ve1',
      TEMPLATE_ID: 'template_6oiipvk',
      PUBLIC_KEY: 'MhLednlk47LyghD7y'
    };

    const correosExtra = ['paccis@uss.edu.pe', 'jefe.cis@uss.edu.pe'];

    for (const seccionInfo of asignacion.secciones) {
      const docente = seccionInfo.docente;
      
      if (!docente) {
        resultados.push({
          docente: 'Sin docente asignado',
          email: 'N/A',
          success: false,
          message: 'No hay docente asignado',
          seccion: seccionInfo.seccion
        });
        continue;
      }

      if (!docente.correoInstitucional) {
        resultados.push({
          docente: docente.nombre,
          email: 'Sin correo USS',
          success: false,
          message: 'Docente sin correo institucional',
          seccion: seccionInfo.seccion
        });
        continue;
      }

      try {
        const templateParams = {
          'nombre_docente': docente.nombre,
          'curso_completo': `${cursoSeleccionado} - ${esCursoSinSecciones ? 'GENERAL' : seccionInfo.seccion} (${periodoAcademico})`,
          'enlace_curso': seccionInfo.enlace || 'https://aulauss.edu.pe',
          'modalidad': seccionInfo.modalidad,
          'dias': esCursoSinSecciones ? 'POR DEFINIR' : seccionInfo.dias,
          'horario': esCursoSinSecciones ? 'POR DEFINIR' : seccionInfo.horario,
          
          'email': docente.correoInstitucional,
          'to_email': docente.correoInstitucional,
          'from_name': 'Centro de Informática USS',
          'reply_to': docente.correoInstitucional,
          
          // ASUNTO CORREGIDO: "Asignación de Curso [NOMBRE DEL CURSO]"
          'subject': `Asignación de Curso "${cursoSeleccionado}"`
        };

        // Enviar al docente
        await emailjs.send(
          EMAILJS_CONFIG.SERVICE_ID,
          EMAILJS_CONFIG.TEMPLATE_ID,
          templateParams,
          EMAILJS_CONFIG.PUBLIC_KEY
        );

        resultados.push({
          docente: docente.nombre,
          email: docente.correoInstitucional,
          success: true,
          message: 'Correo enviado',
          seccion: seccionInfo.seccion
        });

        // Enviar copias
        for (const correoExtra of correosExtra) {
          try {
            await emailjs.send(
              EMAILJS_CONFIG.SERVICE_ID,
              EMAILJS_CONFIG.TEMPLATE_ID,
              { 
                ...templateParams, 
                'email': correoExtra,
                'to_email': correoExtra,
                'nombre_docente': `Copia para administración - ${docente.nombre}`,
                'subject': `[COPIA] ${templateParams.subject}`
              },
              EMAILJS_CONFIG.PUBLIC_KEY
            );
          } catch (error) {
            console.log('⚠️ Error en copia:', error.message);
          }
        }

      } catch (error) {
        resultados.push({
          docente: docente.nombre,
          email: docente.correoInstitucional,
          success: false,
          message: error.text || 'Error',
          seccion: seccionInfo.seccion
        });
        console.error('Error enviando correo:', error);
      }
    }

    const exitososTotal = resultados.filter(r => r.success).length;
    const fallidosTotal = resultados.filter(r => !r.success).length;
    
    alert(`📧 ENVÍOS COMPLETADOS\n✅ Exitosos: ${exitososTotal}\n❌ Fallidos: ${fallidosTotal}`);
    
    if (exitososTotal > 0 && onAsignacionCompletada) {
      onAsignacionCompletada();
    }

  } catch (error) {
    console.error('Error general:', error);
    alert('❌ Error en el proceso');
  } finally {
    setEnviandoCorreos(false);
  }
};

  // FUNCIÓN PARA RECARGAR CURSOS
  const recargarCursos = async () => {
    try {
      setCargando(true);
      const cursosRef = collection(db, 'cursos');
      const querySnapshot = await getDocs(cursosRef);
      
      if (querySnapshot.empty) {
        setCursosDisponibles([]);
      } else {
        const cursosArray = [];
        
        querySnapshot.forEach((doc) => {
          const cursoData = doc.data();
          cursosArray.push({
            id: doc.id,
            firestoreId: doc.id,
            nombre: cursoData.nombre || 'Sin nombre',
            modalidad: cursoData.modalidad || 'VIRTUAL',
            lugar: cursoData.lugar || 'AULA USS - ZOOM',
            secciones: Array.isArray(cursoData.secciones) ? cursoData.secciones : [],
            ...cursoData
          });
        });
        
        const cursosOrdenados = cursosArray.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setCursosDisponibles(cursosOrdenados);
        
        alert(`✅ ${cursosOrdenados.length} cursos recargados desde Firebase`);
      }
    } catch (error) {
      console.error('Error recargando cursos:', error);
      alert('❌ Error al recargar cursos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h3 className="text-xl font-bold">📚 ASIGNAR CURSO - PERÍODO ACADÉMICO</h3>
            <p className="text-sm opacity-90 mt-1">
              Sistema flexible - Cursos cargados directamente desde Firebase
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
            <FiX size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          
          {/* SECCIÓN 1: PERÍODO ACADÉMICO */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiCalendar className="text-blue-600" />
              Configuración del Período Académico
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2">Período Académico *</label>
                <input
                  type="text"
                  value={periodoAcademico}
                  onChange={(e) => setPeriodoAcademico(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: 2026-I, 2026-II, 2027-I, etc."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplos: 2026-I (Primer semestre 2026), 2026-II (Segundo semestre 2026), 2027-I, etc.
                </p>
              </div>
              <div className="flex items-end">
                <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-800">Período configurado:</p>
                  <p className="text-blue-700 font-bold text-lg">{periodoAcademico}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: GESTIÓN DE CURSOS */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FiBook className="text-blue-600" />
                  {cargando ? 'Cargando cursos...' : `Cursos Disponibles (${cursosDisponibles.length})`}
                </h4>
                <button
                  onClick={recargarCursos}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 flex items-center gap-1"
                  title="Recargar desde Firebase"
                >
                  <FiDatabase size={12} /> Recargar
                </button>
              </div>
              <button
                onClick={() => setModoEdicionCurso(!modoEdicionCurso)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
              >
                {modoEdicionCurso ? '← Ver cursos' : '➕ Crear nuevo curso'}
              </button>
            </div>

            {errorCarga && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">Error de carga:</p>
                <p className="text-red-600 text-sm">{errorCarga}</p>
              </div>
            )}

            {cargando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Cargando cursos desde Firebase...</p>
                <p className="text-gray-500 text-sm mt-2">
                  Accediendo a la colección "cursos"...
                </p>
              </div>
            ) : modoEdicionCurso ? (
              // FORMULARIO PARA CREAR/EDITAR CURSO
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nombre del Curso *</label>
                    <input
                      type="text"
                      value={nuevoCurso.nombre}
                      onChange={(e) => setNuevoCurso({...nuevoCurso, nombre: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ej: WORD 365 AVANZADO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Modalidad</label>
                    <select
                      value={nuevoCurso.modalidad}
                      onChange={(e) => setNuevoCurso({...nuevoCurso, modalidad: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="VIRTUAL">Virtual</option>
                      <option value="PRESENCIAL">Presencial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Lugar</label>
                    <input
                      type="text"
                      value={nuevoCurso.lugar}
                      onChange={(e) => setNuevoCurso({...nuevoCurso, lugar: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ej: AULA USS - ZOOM"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {cursoEditando ? (
                    <>
                      <button
                        onClick={actualizarCurso}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        ✅ Actualizar Curso
                      </button>
                      <button
                        onClick={() => {
                          setCursoEditando(null);
                          setModoEdicionCurso(false);
                          setNuevoCurso({ nombre: '', modalidad: 'VIRTUAL', lugar: 'AULA USS - ZOOM', secciones: [] });
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={agregarNuevoCurso}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      >
                        💾 Guardar Curso en Firebase
                      </button>
                      <button
                        onClick={() => setModoEdicionCurso(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // SELECTOR DE CURSO EXISTENTE - CORREGIDO
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2">Seleccionar Curso *</label>
                    
                    {/* SELECTOR NORMAL - DESPLIEGA AL HACER CLIC */}
                    <div className="relative">
                      <select
                        value={cursoSeleccionado}
                        onChange={(e) => {
                          setCursoSeleccionado(e.target.value);
                          setAsignacionesPorSeccion({});
                          setMostrarFormularioSeccion(false);
                        }}
                        className="w-full border rounded-lg px-4 py-3 bg-white appearance-none cursor-pointer"
                      >
                        <option value="" className="text-gray-500">
                          {cursosDisponibles.length === 0 ? 'No hay cursos en Firebase' : '-- Seleccionar curso --'}
                        </option>
                        
                        {/* Agrupar cursos por tipo para mejor organización */}
                        <optgroup label="📚 Cursos con secciones">
                          {cursosDisponibles
                            .filter(curso => curso.secciones && curso.secciones.length > 0)
                            .map((curso) => (
                              <option 
                                key={curso.id} 
                                value={curso.nombre}
                              >
                                {curso.nombre} - {curso.secciones.length} secciones
                              </option>
                            ))
                          }
                        </optgroup>
                        
                        <optgroup label="📝 Cursos sin secciones">
                          {cursosDisponibles
                            .filter(curso => !curso.secciones || curso.secciones.length === 0)
                            .map((curso) => (
                              <option 
                                key={curso.id} 
                                value={curso.nombre}
                              >
                                {curso.nombre} - 0 secciones
                              </option>
                            ))
                          }
                        </optgroup>
                      </select>
                      
                      {/* Ícono de flecha para indicar que es un dropdown */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <FiChevronDown className="text-gray-500" />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                      <div>
                        🔗 {cursosDisponibles.length} cursos cargados desde Firebase
                      </div>
                      <button
                        onClick={recargarCursos}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                      >
                        <FiDatabase size={10} /> Recargar lista
                      </button>
                    </div>
                  </div>
                  
                  {cursoSeleccionado && cursoCompleto && (
                    <div className="flex gap-2 items-start">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 min-w-[200px]">
                        <p className="text-sm font-semibold text-blue-800">Curso seleccionado:</p>
                        <p className="font-bold text-lg truncate">{cursoCompleto.nombre}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          ID: {cursoCompleto.id.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-600">
                          Secciones: {cursoCompleto.secciones?.length || 0}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => editarCurso(cursoCompleto)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => eliminarCurso(cursoCompleto.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CREAR SECCIONES PEAD PARA EL CURSO SELECCIONADO */}
                {cursoCompleto && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="font-semibold text-lg">Secciones PEAD de {cursoCompleto.nombre}</h5>
                        <p className="text-sm text-gray-600">
                          {(cursoCompleto.secciones || []).length} sección(es) PEAD definidas
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setMostrarFormularioSeccion(!mostrarFormularioSeccion)}
                        className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center gap-1"
                      >
                        <FiPlus size={16} />
                        {mostrarFormularioSeccion ? 'Cancelar' : '➕ Crear sección PEAD'}
                      </button>
                    </div>

                    {/* FORMULARIO PARA CREAR NUEVA SECCIÓN PEAD */}
                    {mostrarFormularioSeccion && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h6 className="font-medium mb-3 text-blue-800">Crear nueva sección PEAD</h6>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                          <div>
                            <label className="block text-xs font-semibold mb-1">Letra de la sección *</label>
                            <input
                              type="text"
                              value={nuevaSeccionPEAD.letra}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, letra: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                              placeholder="Ej: a, b, c..."
                              maxLength="2"
                            />
                            <p className="text-xs text-gray-500 mt-1">La sección será: PEAD {nuevaSeccionPEAD.letra}</p>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold mb-1">Turno</label>
                            <select
                              value={nuevaSeccionPEAD.turno}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, turno: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                            >
                              <option value="MAÑANA">Mañana</option>
                              <option value="TARDE">Tarde</option>
                              <option value="NOCHE">Noche</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold mb-1">Días</label>
                            <input
                              type="text"
                              value={nuevaSeccionPEAD.dias}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, dias: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                              placeholder="Ej: LUNES Y MIÉRCOLES"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold mb-1">Horario</label>
                            <input
                              type="text"
                              value={nuevaSeccionPEAD.horario}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, horario: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                              placeholder="Ej: 08:00 AM - 11:00 AM"
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <button
                              onClick={agregarSeccionPEAD}
                              className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Crear PEAD {nuevaSeccionPEAD.letra}
                            </button>
                          </div>
                        </div>
                        
                        {nuevaSeccionPEAD.enlace && (
                          <div className="mb-3">
                            <label className="block text-xs font-semibold mb-1">Enlace del aula (opcional)</label>
                            <input
                              type="text"
                              value={nuevaSeccionPEAD.enlace}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, enlace: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                              placeholder="https://www.aulauss.edu.pe/..."
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* LISTA DE SECCIONES PEAD EXISTENTES */}
                    {cursoCompleto.secciones && cursoCompleto.secciones.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {cursoCompleto.secciones.map((seccion) => {
                            const docenteAsignado = getDocenteEnSeccion(seccion.id);
                            
                            return (
                              <div key={seccion.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h6 className="font-bold text-gray-800">{seccion.seccion}</h6>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {seccion.turno} • {seccion.dias} • {seccion.horario}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => eliminarSeccionPEAD(seccion.id, cursoCompleto.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Eliminar sección"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                                
                                {docenteAsignado ? (
                                  <div className="p-2 bg-green-50 rounded border border-green-200">
                                    <p className="text-sm font-medium text-green-800">{docenteAsignado.nombre}</p>
                                    <p className="text-xs text-green-700">{docenteAsignado.correoInstitucional}</p>
                                  </div>
                                ) : (
                                  <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-center">
                                    <p className="text-sm text-yellow-700">⏳ Sin docente asignado</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 text-gray-500 bg-gray-50 rounded">
                        <p className="mb-2">Este curso no tiene secciones PEAD definidas.</p>
                        <p className="text-sm">Haz click en "Crear sección PEAD" para agregar la primera sección.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: ASIGNACIÓN DE DOCENTES A SECCIONES PEAD */}
          {!modoEdicionCurso && !cargando && cursoSeleccionado && cursoCompleto?.secciones && cursoCompleto.secciones.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FiUserCheck className="text-purple-600" />
                  Asignar Docentes a Secciones PEAD
                </h4>
                <div className="text-sm text-gray-600">
                  {Object.keys(asignacionesPorSeccion).length} de {cursoCompleto.secciones.length} asignadas
                </div>
              </div>

              {/* BUSCADOR DE DOCENTES */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Buscar docente por nombre..."
                      value={filtroNombre}
                      onChange={(e) => setFiltroNombre(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    {docentes.length} docentes disponibles
                  </div>
                </div>
              </div>

              {/* LISTA DE SECCIONES PEAD PARA ASIGNAR DOCENTES */}
              <div className="space-y-6">
                {cursoCompleto.secciones.map((seccion) => {
                  const docenteAsignado = getDocenteEnSeccion(seccion.id);
                  
                  return (
                    <div key={seccion.id} className="p-5 bg-white rounded-xl border shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                              {seccion.seccion}
                            </div>
                            <div>
                              <h5 className="font-bold text-gray-800">{seccion.turno}</h5>
                              <div className="text-sm text-gray-600">
                                {seccion.dias} • {seccion.horario}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {docenteAsignado ? (
                            <>
                              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                ✅ Asignado
                              </div>
                              <button
                                onClick={() => quitarDocenteDeSeccion(seccion.id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                              >
                                Cambiar
                              </button>
                            </>
                          ) : (
                            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                              ⏳ Sin asignar
                            </div>
                          )}
                        </div>
                      </div>

                      {/* DOCENTE ASIGNADO */}
                      {docenteAsignado && (
                        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-green-800 text-lg">{docenteAsignado.nombre}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <FiMail className="text-green-600" size={14} />
                                <span className="text-green-700">{docenteAsignado.correoInstitucional}</span>
                              </div>
                              {docenteAsignado.celular && (
                                <p className="text-sm text-green-600 mt-1">📱 {docenteAsignado.celular}</p>
                              )}
                            </div>
                            {!docenteAsignado.correoInstitucional && (
                              <div className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm">
                                ⚠️ Sin correo USS
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* LISTA DE DOCENTES DISPONIBLES PARA ESTA SECCIÓN */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Seleccionar docente para {seccion.seccion}:
                        </p>
                        
                        <div className="max-h-48 overflow-y-auto pr-2">
                          {docentesFiltrados.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No se encontraron docentes</p>
                          ) : (
                            docentesFiltrados.map((docente) => {
                              const estaAsignado = estaDocenteAsignado(docente.id);
                              const esAsignadoAqui = docenteAsignado?.id === docente.id;
                              
                              return (
                                <div
                                  key={docente.id}
                                  onClick={() => !estaAsignado || esAsignadoAqui ? asignarDocenteASeccion(seccion.id, docente) : null}
                                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                                    esAsignadoAqui
                                      ? 'bg-blue-100 border-2 border-blue-300'
                                      : estaAsignado
                                      ? 'bg-gray-100 border border-gray-300 opacity-60 cursor-not-allowed'
                                      : 'bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                                  } ${!docente.correoInstitucional ? 'border-l-4 border-l-red-400' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                          esAsignadoAqui ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                          {esAsignadoAqui ? '✓' : '+'}
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-800">{docente.nombre}</p>
                                          <div className="flex items-center gap-1 text-sm">
                                            <FiMail size={12} className={docente.correoInstitucional ? "text-green-500" : "text-red-500"} />
                                            <span className={docente.correoInstitucional ? "text-gray-600" : "text-red-500 font-medium"}>
                                              {docente.correoInstitucional || 'Sin correo USS'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {estaAsignado && !esAsignadoAqui && (
                                      <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                        Asignado a otra sección
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECCIÓN PARA CURSOS SIN SECCIONES */}
          {!modoEdicionCurso && !cargando && cursoSeleccionado && (!cursoCompleto?.secciones || cursoCompleto.secciones.length === 0) && (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📚</div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">
                  Curso sin secciones definidas
                </h4>
                <p className="text-gray-600 mb-6">
                  El curso <span className="font-semibold">{cursoSeleccionado}</span> no tiene secciones PEAD definidas.
                  Puedes asignar un docente general o crear secciones primero.
                </p>
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setMostrarFormularioSeccion(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FiPlus /> Crear primera sección PEAD
                  </button>
                  
                  <button
                    onClick={() => {
                      // Asignar un docente general
                      if (docentes.length > 0) {
                        setAsignacionesPorSeccion({ 'general': docentes[0] });
                      }
                    }}
                    className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
                  >
                    Asignar docente general
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          {!modoEdicionCurso && !cargando && cursoSeleccionado && (
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={enviarCorreos}
                disabled={enviandoCorreos || (cursoCompleto?.secciones?.length > 0 && Object.keys(asignacionesPorSeccion).length === 0)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-800 disabled:opacity-50 flex items-center gap-2"
              >
                {enviandoCorreos ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Enviando correos...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Asignar y Enviar Correos ({periodoAcademico})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalAsignarCurso;
