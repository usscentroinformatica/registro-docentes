// src/components/ModalAsignarCurso.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiCalendar, FiUserCheck, FiSend, FiPlus, FiTrash2, FiMail, FiBook, FiChevronDown, FiClock, FiLink } from 'react-icons/fi';
import emailjs from '@emailjs/browser';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ModalAsignarCurso = ({ docentes, onClose, onAsignacionCompletada }) => {
  const [asignacionesPorSeccion, setAsignacionesPorSeccion] = useState({});
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [periodoAcademico, setPeriodoAcademico] = useState('2026-I');
  const [enviandoCorreos, setEnviandoCorreos] = useState(false);
  
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
    letra: 'a',
    turno: 'MAÑANA',
    ciclo: 'REGULAR', // REGULAR, INTENSIVO, SUPER_INTENSIVO
    dias: ['LUNES', 'MIÉRCOLES'], // Array de días seleccionados
    horaInicio: '08:00',
    horaFin: '11:00',
    enlace: 'https://www.aulauss.edu.pe/'
  });
  
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [mostrarEditarEnlaceMap, setMostrarEditarEnlaceMap] = useState({});
  const [nuevoEnlaceMap, setNuevoEnlaceMap] = useState({});
  const [filtrosSeccion, setFiltrosSeccion] = useState({}); // Filtro por sección

  // Opciones de configuración
  const CICLOS_CONFIG = useMemo(() => ({
    REGULAR: {
      nombre: 'Ciclo Regular',
      diasRecomendados: ['LUNES', 'MIÉRCOLES'],
      diasDisponibles: ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'],
      horasSugeridas: [
        { inicio: '08:00', fin: '11:00', label: 'Mañana (8:00-11:00)' },
        { inicio: '11:00', fin: '14:00', label: 'Mañana (11:00-14:00)' },
        { inicio: '14:00', fin: '17:00', label: 'Tarde (14:00-17:00)' },
        { inicio: '17:00', fin: '20:00', label: 'Tarde (17:00-20:00)' },
        { inicio: '18:00', fin: '21:00', label: 'Noche (18:00-21:00)' }
      ]
    },
    INTENSIVO: {
      nombre: 'Ciclo Intensivo',
      diasRecomendados: ['LUNES', 'MIÉRCOLES'],
      diasDisponibles: ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'],
      horasSugeridas: [
        { inicio: '08:00', fin: '12:00', label: 'Intensivo Mañana (8:00-12:00)' },
        { inicio: '14:00', fin: '18:00', label: 'Intensivo Tarde (14:00-18:00)' },
        { inicio: '18:00', fin: '22:00', label: 'Intensivo Noche (18:00-22:00)' }
      ]
    },
    SUPER_INTENSIVO: {
      nombre: 'Ciclo Super Intensivo',
      diasRecomendados: ['LUNES', 'MIÉRCOLES', 'VIERNES'],
      diasDisponibles: ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'],
      horasSugeridas: [
        { inicio: '08:00', fin: '12:00', label: 'Súper Intensivo Mañana (8:00-12:00)' },
        { inicio: '14:00', fin: '18:00', label: 'Súper Intensivo Tarde (14:00-18:00)' },
        { inicio: '18:00', fin: '22:00', label: 'Súper Intensivo Noche (18:00-22:00)' }
      ]
    }
  }), []);

  const DIAS_SEMANA = [
    { value: 'LUNES', label: 'Lunes' },
    { value: 'MARTES', label: 'Martes' },
    { value: 'MIÉRCOLES', label: 'Miércoles' },
    { value: 'JUEVES', label: 'Jueves' },
    { value: 'VIERNES', label: 'Viernes' },
    { value: 'SÁBADO', label: 'Sábado' },
    { value: 'DOMINGO', label: 'Domingo' }
  ];

  // CARGAR TODOS LOS CURSOS DESDE LA COLECCIÓN "cursos" DE FIREBASE
  useEffect(() => {
    const cargarCursosDesdeFirebase = async () => {
      try {
        setCargando(true);
        setErrorCarga(null);
        
        console.log('🔄 Iniciando carga de cursos desde Firebase...');
        
        const cursosRef = collection(db, 'cursos');
        const querySnapshot = await getDocs(cursosRef);
        
        console.log(`📊 Total documentos en colección 'cursos': ${querySnapshot.size}`);
        
        if (querySnapshot.empty) {
          console.log('⚠️ La colección "cursos" está vacía');
          setCursosDisponibles([]);
        } else {
          const cursosArray = [];
          
          querySnapshot.forEach((doc) => {
            const cursoData = doc.data();
            
            // Asegurar que las secciones tengan el formato correcto
            const seccionesFormateadas = Array.isArray(cursoData.secciones) 
              ? cursoData.secciones.map(seccion => ({
                  ...seccion,
                  dias: Array.isArray(seccion.dias) ? seccion.dias : 
                        typeof seccion.dias === 'string' ? [seccion.dias] : 
                        ['LUNES', 'MIÉRCOLES']
                }))
              : [];
            
            cursosArray.push({
              id: doc.id,
              firestoreId: doc.id,
              nombre: cursoData.nombre || 'Sin nombre',
              modalidad: cursoData.modalidad || 'VIRTUAL',
              lugar: cursoData.lugar || 'AULA USS - ZOOM',
              secciones: seccionesFormateadas,
              ...cursoData
            });
          });
          
          const cursosOrdenados = cursosArray.sort((a, b) => 
            a.nombre.localeCompare(b.nombre)
          );
          
          console.log('✅ Cursos cargados exitosamente:', cursosOrdenados.length);
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

  // Manejar cambio de ciclo
  useEffect(() => {
    if (nuevaSeccionPEAD.ciclo) {
      const config = CICLOS_CONFIG[nuevaSeccionPEAD.ciclo];
      setNuevaSeccionPEAD(prev => ({
        ...prev,
        dias: [...config.diasRecomendados]
      }));
    }
  }, [nuevaSeccionPEAD.ciclo, CICLOS_CONFIG]);

  // Formatear horario para mostrar
  const formatearHorario = (hora) => {
    const [horas, minutos] = hora.split(':');
    const horaNum = parseInt(horas);
    const ampm = horaNum >= 12 ? 'PM' : 'AM';
    const hora12 = horaNum % 12 || 12;
    return `${hora12}:${minutos} ${ampm}`;
  };

  // AGREGAR SECCIÓN PEAD MANUALMENTE
  const agregarSeccionPEAD = async () => {
    if (!cursoCompleto || !nuevaSeccionPEAD.letra.trim()) {
      alert('Por favor ingresa una letra para la sección PEAD');
      return;
    }

    if (!nuevaSeccionPEAD.enlace.trim() || !nuevaSeccionPEAD.enlace.startsWith('http')) {
      alert('Por favor ingresa un enlace válido para el aula');
      return;
    }

    const letra = nuevaSeccionPEAD.letra;
    const seccionNombre = `PEAD-${letra}`;
    const seccionId = `${cursoCompleto.id}_pead_${letra.toLowerCase()}`;
    
    // Formatear días como string para mostrar
    const diasString = nuevaSeccionPEAD.dias.join(' - ');
    const horarioString = `${formatearHorario(nuevaSeccionPEAD.horaInicio)} - ${formatearHorario(nuevaSeccionPEAD.horaFin)}`;
    
    const nuevaSeccion = {
      id: seccionId,
      seccion: seccionNombre,
      turno: nuevaSeccionPEAD.turno,
      ciclo: nuevaSeccionPEAD.ciclo,
      dias: nuevaSeccionPEAD.dias, // Guardar como array
      diasString: diasString, // Guardar también como string para mostrar
      horaInicio: nuevaSeccionPEAD.horaInicio,
      horaFin: nuevaSeccionPEAD.horaFin,
      horario: horarioString,
      horarioCompleto: `${diasString} ${horarioString}`,
      enlace: nuevaSeccionPEAD.enlace,
      configuracion: CICLOS_CONFIG[nuevaSeccionPEAD.ciclo]
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
        ciclo: 'REGULAR',
        dias: CICLOS_CONFIG.REGULAR.diasRecomendados,
        horaInicio: '08:00',
        horaFin: '11:00',
        enlace: 'https://www.aulauss.edu.pe/'
      });
      
      setMostrarFormularioSeccion(false);
      
      alert(`✅ Sección ${seccionNombre} agregada exitosamente`);
    } catch (error) {
      console.error('Error agregando sección PEAD:', error);
      alert('❌ Error al agregar sección: ' + error.message);
    }
  };

  // EDITAR ENLACE DE SECCIÓN EXISTENTE
  const editarEnlaceSeccion = async (seccionId, cursoId, nuevoEnlace) => {
    if (!nuevoEnlace.trim() || !nuevoEnlace.startsWith('http')) {
      alert('Por favor ingresa un enlace válido');
      return;
    }

    try {
      const curso = cursosDisponibles.find(c => c.id === cursoId);
      if (!curso) return;

      const seccionesActualizadas = curso.secciones.map(seccion => 
        seccion.id === seccionId ? { ...seccion, enlace: nuevoEnlace } : seccion
      );
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'cursos', cursoId), {
        secciones: seccionesActualizadas
      });

      // Actualizar estado local
      setCursosDisponibles(prev => 
        prev.map(c => c.id === cursoId ? { ...c, secciones: seccionesActualizadas } : c)
      );

      alert('✅ Enlace actualizado');
    } catch (error) {
      console.error('Error actualizando enlace:', error);
      alert('❌ Error al actualizar enlace: ' + error.message);
    }
  };

  // Obtener la siguiente letra disponible
  const obtenerSiguienteLetra = (curso) => {
    const secciones = curso.secciones || [];
    if (secciones.length === 0) return 'a';
    
    const letrasExistentes = secciones
      .map(s => {
        const match = s.seccion.match(/PEAD\s+(\w)/i);
        return match ? match[1].toLowerCase() : null;
      })
      .filter(l => l !== null);
    
    if (letrasExistentes.length === 0) return 'a';
    
    const alfabeto = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < alfabeto.length; i++) {
      const letra = alfabeto[i];
      if (!letrasExistentes.includes(letra)) {
        return letra;
      }
    }
    
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
      
      await updateDoc(doc(db, 'cursos', cursoId), {
        secciones: nuevasSecciones
      });

      setCursosDisponibles(prev => 
        prev.map(c => c.id === cursoId ? { ...c, secciones: nuevasSecciones } : c)
      );

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

  // MANEJO DE CURSOS (sin cambios significativos)
  const agregarNuevoCurso = async () => {
    if (!nuevoCurso.nombre.trim()) {
      alert('El curso necesita un nombre');
      return;
    }

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

  // FUNCIÓN DE ASIGNACIÓN - Permite que un docente tenga múltiples PEAD
  const asignarDocenteASeccion = (seccionId, docente) => {
    setAsignacionesPorSeccion(prev => {
      const nuevasAsignaciones = { ...prev };
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
    
    // Verificar que todas las secciones tengan enlace
    const seccionesSinEnlace = secciones.filter(s => !s.enlace || !s.enlace.trim());
    if (seccionesSinEnlace.length > 0) {
      alert(`Las siguientes secciones no tienen enlace:\n${seccionesSinEnlace.map(s => s.seccion).join(', ')}\nPor favor agregue el enlace del aula.`);
      return false;
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
              ciclo: seccion?.ciclo || 'REGULAR',
              dias: Array.isArray(seccion?.dias) ? seccion.dias.join(' Y ') : seccion?.diasString || '',
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

  // ENVIAR CORREOS - CON ENLACE Y MENSAJE DE BIENVENIDA
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

      // const correosExtra = ['paccis@uss.edu.pe', 'jefe.cis@uss.edu.pe'];
      // TODO: Descomentar cuando se necesite enviar copias a otros correos

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
            'dias': seccionInfo.dias || 'POR DEFINIR',
            'horario': seccionInfo.horario || 'POR DEFINIR',
            'mensaje_bienvenida': `Bienvenido(a) al curso ${cursoSeleccionado}.\n\nSe ha creado el aula virtual en el siguiente enlace:\n${seccionInfo.enlace}\n\nPor favor, acceda y configure su curso según lo planificado.\n\nSaludos cordiales,\nCentro de Informática USS`,
            
            'email': docente.correoInstitucional,
            'to_email': docente.correoInstitucional,
            'from_name': 'Centro de Informática USS',
            'reply_to': docente.correoInstitucional,
            'subject': `Asignación de Curso "${cursoSeleccionado}" - ${periodoAcademico}`
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

          // COMENTADO: Envío de copias a correos extra - Solo envío al docente por ahora
          // for (const correoExtra of correosExtra) {
          //   try {
          //     await emailjs.send(
          //       EMAILJS_CONFIG.SERVICE_ID,
          //       EMAILJS_CONFIG.TEMPLATE_ID,
          //       { 
          //         ...templateParams, 
          //         'email': correoExtra,
          //         'to_email': correoExtra,
          //         'nombre_docente': `Copia para administración - ${docente.nombre}`,
          //         'subject': `[COPIA] ${templateParams.subject}`
          //       },
          //       EMAILJS_CONFIG.PUBLIC_KEY
          //     );
          //   } catch (error) {
          //     console.log('⚠️ Error en copia:', error.message);
          //   }
          // }

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

  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center text-white" style={{backgroundColor: '#5a2290'}}>
          <div>
            <h3 className="text-xl font-bold">📚 ASIGNAR CURSO - PERÍODO ACADÉMICO</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
            <FiX size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          
          {/* SECCIÓN 1: PERÍODO ACADÉMICO */}
          <div className="rounded-xl p-6 border-l-4" style={{backgroundColor: '#f0f9fb', borderLeftColor: '#11acd3'}}>
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2" style={{color: '#5a2290'}}>
              <FiCalendar className="" style={{color: '#11acd3'}} />
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
                  style={{borderColor: '#11acd3'}}
                  placeholder="Ej: 2026-I, 2026-II, 2027-I, etc."
                  required
                />
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
          <div className="rounded-xl p-6 border-l-4" style={{backgroundColor: '#f0f9fb', borderLeftColor: '#11acd3'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2" style={{color: '#5a2290'}}>
                  <FiBook className="" style={{color: '#11acd3'}} />
                  {cargando ? 'Cargando cursos...' : `Cursos Disponibles (${cursosDisponibles.length})`}
                </h4>
              </div>
              <button
                onClick={() => setModoEdicionCurso(!modoEdicionCurso)}
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
                style={{backgroundColor: '#63ed12', color: '#000'}}
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
                      style={{borderColor: '#11acd3'}}
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
                      style={{borderColor: '#11acd3'}}
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
                        className="px-6 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition"
                        style={{backgroundColor: '#11acd3'}}
                      >
                        💾 Guardar Curso
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
              // SELECTOR DE CURSO EXISTENTE
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2">Seleccionar Curso *</label>
                    
                    <div className="relative">
                      <select
                        value={cursoSeleccionado}
                        onChange={(e) => {
                          setCursoSeleccionado(e.target.value);
                          setAsignacionesPorSeccion({});
                          setMostrarFormularioSeccion(false);
                        }}
                        className="w-full border rounded-lg px-4 py-3 bg-white appearance-none cursor-pointer"
                        style={{borderColor: '#11acd3'}}
                      >
                        <option value="" className="text-gray-500">
                          {cursosDisponibles.length === 0 ? 'No hay cursos en Firebase' : '-- Seleccionar curso --'}
                        </option>
                        
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
                      
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <FiChevronDown className="text-gray-500" />
                      </div>
                    </div>
                  </div>
                  
                  {cursoSeleccionado && cursoCompleto && (
                    <div className="flex gap-2 items-start">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 min-w-[200px]">
                        <p className="text-sm font-semibold text-blue-800">Curso seleccionado:</p>
                        <p className="font-bold text-lg truncate">{cursoCompleto.nombre}</p>
                        <p className="text-sm text-gray-600">
                          Secciones: {cursoCompleto.secciones?.length || 0}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => editarCurso(cursoCompleto)}
                          className="px-4 py-2 text-white rounded-lg text-sm hover:opacity-90 transition"
                          style={{backgroundColor: '#11acd3'}}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => eliminarCurso(cursoCompleto.id)}
                          className="px-4 py-2 text-white rounded-lg text-sm hover:opacity-90 transition"
                          style={{backgroundColor: '#5a2290'}}
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
                        <h5 className="font-semibold text-lg">Secciones pead de {cursoCompleto.nombre}</h5>
                        <p className="text-sm text-gray-600">
                          {(cursoCompleto.secciones || []).length} sección(es) PEAD definidas
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setMostrarFormularioSeccion(!mostrarFormularioSeccion)}
                        className="px-4 py-2 text-white rounded text-sm hover:opacity-90 transition flex items-center gap-1"
                        style={{backgroundColor: '#63ed12', color: '#000'}}
                      >
                        <FiPlus size={16} />
                        {mostrarFormularioSeccion ? 'Cancelar' : '➕ Crear sección PEAD'}
                      </button>
                    </div>

                    {/* FORMULARIO PARA CREAR NUEVA SECCIÓN PEAD - MEJORADO */}
                    {mostrarFormularioSeccion && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h6 className="font-medium mb-3 text-blue-800">Crear nueva sección PEAD</h6>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                          <div>
                            <label className="block text-xs font-semibold mb-1">Letra de la sección *</label>
                            <input
                              type="text"
                              value={nuevaSeccionPEAD.letra}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, letra: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                              style={{borderColor: '#11acd3'}}
                              maxLength="2"
                            />                            
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold mb-1">Ciclo *</label>
                            <select
                              value={nuevaSeccionPEAD.ciclo}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, ciclo: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                              style={{borderColor: '#11acd3'}}
                            >
                              <option value="REGULAR">Ciclo Regular</option>
                              <option value="INTENSIVO">Intensivo</option>
                              <option value="SUPER_INTENSIVO">Super Intensivo</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold mb-1">Hora Inicio *</label>
                            <input
                              type="time"
                              value={nuevaSeccionPEAD.horaInicio}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, horaInicio: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                              style={{borderColor: '#11acd3'}}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {formatearHorario(nuevaSeccionPEAD.horaInicio)}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold mb-1">Hora Finalización *</label>
                            <input
                              type="time"
                              value={nuevaSeccionPEAD.horaFin}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, horaFin: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                              style={{borderColor: '#11acd3'}}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {formatearHorario(nuevaSeccionPEAD.horaFin)}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold mb-1">Turno</label>
                            <select
                              value={nuevaSeccionPEAD.turno}
                              onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, turno: e.target.value})}
                              className="w-full border rounded px-3 py-2 text-sm"
                              style={{borderColor: '#11acd3'}}
                            >
                              <option value="MAÑANA">Mañana</option>
                              <option value="TARDE">Tarde</option>
                              <option value="NOCHE">Noche</option>
                            </select>
                          </div>
                        </div>

                        {/* DÍAS DE LA SEMANA - SELECCIÓN MÚLTIPLE */}
                        <div className="mb-4">
                          <label className="block text-xs font-semibold mb-2">
                            Días de la semana * (Seleccione {CICLOS_CONFIG[nuevaSeccionPEAD.ciclo].diasRecomendados.length} días)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {DIAS_SEMANA.map((dia) => {
                              const config = CICLOS_CONFIG[nuevaSeccionPEAD.ciclo];
                              const isRecommended = config.diasRecomendados.includes(dia.value);
                              const isSelected = nuevaSeccionPEAD.dias.includes(dia.value);
                              
                              return (
                                <button
                                  key={dia.value}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      // Remover día
                                      setNuevaSeccionPEAD({
                                        ...nuevaSeccionPEAD,
                                        dias: nuevaSeccionPEAD.dias.filter(d => d !== dia.value)
                                      });
                                    } else {
                                      // Agregar día (con límite según ciclo)
                                      if (nuevaSeccionPEAD.dias.length < config.diasRecomendados.length) {
                                        setNuevaSeccionPEAD({
                                          ...nuevaSeccionPEAD,
                                          dias: [...nuevaSeccionPEAD.dias, dia.value]
                                        });
                                      } else {
                                        alert(`Solo puede seleccionar ${config.diasRecomendados.length} días para ciclo ${config.nombre}`);
                                      }
                                    }
                                  }}
                                  className={`px-3 py-2 rounded text-sm border ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : isRecommended
                                      ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                  }`}
                                >
                                  {dia.label}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Días seleccionados: {nuevaSeccionPEAD.dias.join(', ')}
                          </p>
                        </div>

                        {/* ENLACE DEL AULA - OBLIGATORIO */}
                        <div className="mb-4">
                          <label className="block text-xs font-semibold mb-1">
                            <FiLink className="inline mr-1" />
                            Enlace del aula virtual * (URL completa)
                          </label>
                          <input
                            type="url"
                            value={nuevaSeccionPEAD.enlace}
                            onChange={(e) => setNuevaSeccionPEAD({...nuevaSeccionPEAD, enlace: e.target.value})}
                            className="w-full border rounded px-3 py-2 text-sm"
                            style={{borderColor: '#11acd3'}}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Este enlace será enviado al docente para acceder al aula virtual
                          </p>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={agregarSeccionPEAD}
                            className="px-6 py-2 text-white rounded text-sm hover:opacity-90 transition flex items-center gap-2"
                            style={{backgroundColor: '#63ed12', color: '#000'}}
                            disabled={!nuevaSeccionPEAD.enlace || !nuevaSeccionPEAD.enlace.startsWith('http')}
                          >
                            <FiPlus />
                            Crear PEAD-{nuevaSeccionPEAD.letra}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* LISTA DE SECCIONES PEAD EXISTENTES - CON EDICIÓN DE ENLACE */}
                    {cursoCompleto.secciones && cursoCompleto.secciones.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {cursoCompleto.secciones.map((seccion) => {
                            const docenteAsignado = getDocenteEnSeccion(seccion.id);
                            const mostrarEditarEnlace = mostrarEditarEnlaceMap[seccion.id] || false;
                            const nuevoEnlace = nuevoEnlaceMap[seccion.id] || seccion.enlace;
                            const setMostrarEditarEnlace = (value) => setMostrarEditarEnlaceMap(prev => ({ ...prev, [seccion.id]: value }));
                            const setNuevoEnlace = (value) => setNuevoEnlaceMap(prev => ({ ...prev, [seccion.id]: value }));
                            
                            return (
                              <div key={seccion.id} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h6 className="font-bold text-gray-800">{seccion.seccion}</h6>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {seccion.ciclo ? CICLOS_CONFIG[seccion.ciclo]?.nombre || seccion.ciclo : 'Ciclo'}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <div className="flex items-center gap-1 mb-1">
                                        <FiClock size={12} />
                                        {seccion.turno} • {seccion.horario}
                                      </div>
                                      <div>{seccion.diasString || (Array.isArray(seccion.dias) ? seccion.dias.join(' Y ') : '')}</div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setMostrarEditarEnlace(!mostrarEditarEnlace)}
                                      className="text-blue-500 hover:text-blue-700 p-1"
                                      title="Editar enlace"
                                    >
                                      <FiLink size={14} />
                                    </button>
                                    <button
                                      onClick={() => eliminarSeccionPEAD(seccion.id, cursoCompleto.id)}
                                      className="text-red-500 hover:text-red-700 p-1"
                                      title="Eliminar sección"
                                    >
                                      <FiTrash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* EDITAR ENLACE */}
                                {mostrarEditarEnlace && (
                                  <div className="mb-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                                    <label className="block text-xs font-semibold mb-1">
                                      Editar enlace del aula:
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="url"
                                        value={nuevoEnlace}
                                        onChange={(e) => setNuevoEnlace(e.target.value)}
                                        className="flex-1 border rounded px-3 py-1 text-sm"
                                        placeholder="https://..."
                                      />
                                      <button
                                        onClick={() => {
                                          editarEnlaceSeccion(seccion.id, cursoCompleto.id, nuevoEnlace);
                                          setMostrarEditarEnlace(false);
                                        }}
                                        className="px-3 py-1 text-white rounded text-sm hover:opacity-90 transition"
                                        style={{backgroundColor: '#11acd3'}}
                                      >
                                        Guardar
                                      </button>
                                      <button
                                        onClick={() => {
                                          setMostrarEditarEnlace(false);
                                          setNuevoEnlace(seccion.enlace);
                                        }}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Actual: {seccion.enlace?.substring(0, 40)}...
                                    </p>
                                  </div>
                                )}

                                {/* ENLACE ACTUAL */}
                                <div className="mb-3 p-2 bg-gray-100 rounded">
                                  <div className="flex items-center gap-2 text-sm">
                                    <FiLink size={12} className="text-gray-500" />
                                    <a 
                                      href={seccion.enlace} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 truncate"
                                      title={seccion.enlace}
                                    >
                                      {seccion.enlace?.substring(0, 40)}...
                                    </a>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Haz clic para verificar el enlace
                                  </p>
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
            <div className="rounded-xl p-6 border-l-4" style={{backgroundColor: '#f0f9fb', borderLeftColor: '#11acd3'}}>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2" style={{color: '#5a2290'}}>
                  <FiUserCheck style={{color: '#11acd3'}} />
                  Asignar Docentes a Secciones pead
                </h4>
                <div className="text-sm text-gray-600">
                  {Object.keys(asignacionesPorSeccion).length} de {cursoCompleto.secciones.length} asignadas
                </div>
              </div>

              {/* LISTA DE SECCIONES PEAD PARA ASIGNAR DOCENTES */}
              <div className="space-y-6">
                {cursoCompleto.secciones.map((seccion) => {
                  const docenteAsignado = getDocenteEnSeccion(seccion.id);
                  const filtroSeccion = filtrosSeccion[seccion.id] || '';
                  
                  // Filtrar docentes según el buscador de cada sección
                  const docentesFiltrradosPorSeccion = filtroSeccion
                    ? docentes.filter(docente => 
                        docente.nombre.toLowerCase().includes(filtroSeccion.toLowerCase())
                      )
                    : docentes;
                  
                  return (
                    <div key={seccion.id} className="p-5 bg-white rounded-xl border shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                              {seccion.seccion}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-bold text-gray-800">{seccion.turno}</h5>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                  {seccion.ciclo ? CICLOS_CONFIG[seccion.ciclo]?.nombre || seccion.ciclo : 'Ciclo'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {seccion.diasString} • {seccion.horario}
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

                      {/* ENLACE DEL AULA (solo lectura) */}
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiLink className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Enlace del aula:</span>
                          </div>
                          <a 
                            href={seccion.enlace} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs"
                            title={seccion.enlace}
                          >
                            {seccion.enlace?.substring(0, 50)}...
                          </a>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Este enlace será enviado al docente asignado
                        </p>
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

                      {/* BUSCADOR DE DOCENTES POR SECCIÓN */}
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder={`Buscar docente para ${seccion.seccion}...`}
                          value={filtroSeccion}
                          onChange={(e) => setFiltrosSeccion({...filtrosSeccion, [seccion.id]: e.target.value})}
                          className="w-full border rounded-lg px-4 py-2 text-sm"
                          style={{borderColor: '#11acd3'}}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {docentesFiltrradosPorSeccion.length} docente(s) encontrado(s)
                        </p>
                      </div>

                      {/* LISTA DE DOCENTES DISPONIBLES */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Seleccionar docente para {seccion.seccion}:
                        </p>
                        
                        <div className="max-h-48 overflow-y-auto pr-2">
                          {docentesFiltrradosPorSeccion.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No se encontraron docentes</p>
                          ) : (
                            docentesFiltrradosPorSeccion.map((docente) => {
                              const esAsignadoAqui = docenteAsignado?.id === docente.id;
                              
                              return (
                                <div
                                  key={docente.id}
                                  onClick={() => asignarDocenteASeccion(seccion.id, docente)}
                                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                                    esAsignadoAqui
                                      ? 'bg-blue-100 border-2 border-blue-300'
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

          {/* SECCIÓN PARA CURSOS SIN SECCIONES - ELIMINADA */}

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
                className="px-8 py-3 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-2 transition hover:opacity-90"
                style={{backgroundColor: '#11acd3'}}
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
