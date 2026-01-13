// src/components/ModalAsignarCurso.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiUserCheck, FiMail, FiSend, FiDownload, FiAlertCircle, FiClock } from 'react-icons/fi';
import emailjs from '@emailjs/browser';
import * as XLSX from 'xlsx';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const ModalAsignarCurso = ({ docentes, onClose, onAsignacionCompletada }) => {
  const [asignacionesPorSeccion, setAsignacionesPorSeccion] = useState({});
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [enviandoCorreos, setEnviandoCorreos] = useState(false);
  const [correosEnviados, setCorreosEnviados] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState('');

  // CURSOS PRINCIPALES VERANO 2026-0 CON ENLACES
const cursosVerano2026 = [
  {
    id: 'word365',
    nombre: 'WORD 365',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'word_pead_a', 
        seccion: 'PEAD a', 
        turno: 'MAÑANA', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '08:00 AM - 11:00 AM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 08:00 AM - 11:00 AM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72268'
      },
      { 
        id: 'word_pead_b', 
        seccion: 'PEAD b', 
        turno: 'TARDE', 
        dias: 'MARTES Y JUEVES',
        horario: '03:00 PM - 06:00 PM',
        horarioCompleto: 'MARTES Y JUEVES 03:00 PM - 06:00 PM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72269'
      },
      { 
        id: 'word_pead_c', 
        seccion: 'PEAD c', 
        turno: 'NOCHE', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '07:00 PM - 10:00 PM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 07:00 PM - 10:00 PM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72270'
      }
    ]
  },
  {
    id: 'excel365',
    nombre: 'EXCEL 365',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'excel_pead_a', 
        seccion: 'PEAD a', 
        turno: 'MAÑANA', 
        dias: 'MARTES Y JUEVES',
        horario: '08:00 AM - 11:00 AM',
        horarioCompleto: 'MARTES Y JUEVES 08:00 AM - 11:00 AM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72271'
      },
      { 
        id: 'excel_pead_b', 
        seccion: 'PEAD b', 
        turno: 'NOCHE', 
        dias: 'MARTES Y JUEVES',
        horario: '07:00 PM - 10:00 PM',
        horarioCompleto: 'MARTES Y JUEVES 07:00 PM - 10:00 PM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72272'
      },
      { 
        id: 'excel_pead_c', 
        seccion: 'PEAD c', 
        turno: 'NOCHE', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '07:00 PM - 10:00 PM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 07:00 PM - 10:00 PM',
        enlace: '' // Sin enlace disponible
      }
    ]
  },
  {
    id: 'excel_asociado',
    nombre: 'EXCEL ASOCIADO',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'excel_asoc_pead_a', 
        seccion: 'PEAD a', 
        turno: 'NOCHE', 
        dias: 'MIÉRCOLES Y VIERNES',
        horario: '07:00 PM - 10:00 PM',
        horarioCompleto: 'MIÉRCOLES Y VIERNES 07:00 PM - 10:00 PM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72275'
      }
    ]
  },
  {
    id: 'canva',
    nombre: 'DISEÑO CON CANVA',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'canva_pead_a', 
        seccion: 'PEAD a', 
        turno: 'MAÑANA', 
        dias: 'MARTES Y JUEVES',
        horario: '08:00 AM - 11:00 AM',
        horarioCompleto: 'MARTES Y JUEVES 08:00 AM - 11:00 AM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72273'
      },
      { 
        id: 'canva_pead_b', 
        seccion: 'PEAD b', 
        turno: 'NOCHE', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '07:00 PM - 10:00 PM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 07:00 PM - 10:00 PM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72274'
      },
      { 
        id: 'canva_pead_c', 
        seccion: 'PEAD c', 
        turno: 'MAÑANA', 
        dias: 'MIÉRCOLES Y VIERNES',
        horario: '08:00 AM - 11:00 AM',
        horarioCompleto: 'MIÉRCOLES Y VIERNES 08:00 AM - 11:00 AM',
        enlace: '' // Sin enlace disponible
      }
    ]
  },
  {
    id: 'bizagi',
    nombre: 'BIZAGI',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'bizagi_pead_a', 
        seccion: 'PEAD a', 
        turno: 'NOCHE', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '07:00 PM - 10:00 PM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 07:00 PM - 10:00 PM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72276'
      }
    ]
  },
  {
    id: 'autocad2d',
    nombre: 'AUTOCAD 2D',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'autocad_pead_a', 
        seccion: 'PEAD a', 
        turno: 'NOCHE', 
        dias: 'MARTES Y JUEVES',
        horario: '07:00 PM - 10:00 PM',
        horarioCompleto: 'MARTES Y JUEVES 07:00 PM - 10:00 PM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72277'
      }
    ]
  },
  {
    id: 'comp_ii',
    nombre: 'COMPUTACIÓN II',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'compii_pead_a', 
        seccion: 'PEAD a', 
        turno: 'MAÑANA', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '08:00 AM - 11:00 AM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 08:00 AM - 11:00 AM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72282'
      }
    ]
  },
  {
    id: 'comp_iii',
    nombre: 'COMPUTACIÓN III',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'compiii_pead_a', 
        seccion: 'PEAD a', 
        turno: 'MAÑANA', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '08:00 AM - 11:00 AM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 08:00 AM - 11:00 AM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72284'
      },
      { 
        id: 'compiii_pead_b', 
        seccion: 'PEAD b', 
        turno: 'TARDE', 
        dias: 'MARTES Y JUEVES',
        horario: '03:00 PM - 06:00 PM',
        horarioCompleto: 'MARTES Y JUEVES 03:00 PM - 06:00 PM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72285'
      },
      { 
        id: 'compiii_pead_c', 
        seccion: 'PEAD c', 
        turno: 'NOCHE', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '07:00 PM - 10:00 PM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 07:00 PM - 10:00 PM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72286'
      }
    ]
  },
  // AGREGAR TALLER WORD Y TALLER EXCEL
  {
    id: 'taller_word',
    nombre: 'TALLER WORD',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'taller_word_pead_a', 
        seccion: 'PEAD a', 
        turno: 'MAÑANA', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '08:00 AM - 11:00 AM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 08:00 AM - 11:00 AM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72278'
      }
    ]
  },
  {
    id: 'taller_excel',
    nombre: 'TALLER EXCEL',
    modalidad: 'VIRTUAL',
    lugar: 'AULA USS - ZOOM',
    secciones: [
      { 
        id: 'taller_excel_pead_a', 
        seccion: 'PEAD a', 
        turno: 'MAÑANA', 
        dias: 'LUNES Y MIÉRCOLES',
        horario: '08:00 AM - 11:00 AM',
        horarioCompleto: 'LUNES Y MIÉRCOLES 08:00 AM - 11:00 AM',
        enlace: 'https://www.aulauss.edu.pe/course/view.php?id=72279'
      }
    ]
  }
];

  // Inicializar EmailJS con tu Public Key
  useEffect(() => {
    emailjs.init('MhLednlk47LyghD7y');
  }, []);

  // Obtener el curso seleccionado completo
  const cursoCompleto = cursosVerano2026.find(c => c.nombre === cursoSeleccionado);

  // Filtrar docentes por nombre
  const docentesFiltrados = filtroNombre 
    ? docentes.filter(docente => 
        docente.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      )
    : docentes;

  // Manejar asignación de docente a sección
  const asignarDocenteASeccion = (seccionId, docente) => {
    setAsignacionesPorSeccion(prev => {
      const nuevasAsignaciones = { ...prev };
      
      // Si el docente ya está asignado a otra sección del mismo curso, quitarlo
      Object.keys(nuevasAsignaciones).forEach(key => {
        if (nuevasAsignaciones[key]?.id === docente.id && key !== seccionId) {
          delete nuevasAsignaciones[key];
        }
      });
      
      // Asignar el docente a la nueva sección
      nuevasAsignaciones[seccionId] = docente;
      
      return nuevasAsignaciones;
    });
  };

  // Quitar docente de una sección
  const quitarDocenteDeSeccion = (seccionId) => {
    setAsignacionesPorSeccion(prev => {
      const nuevasAsignaciones = { ...prev };
      delete nuevasAsignaciones[seccionId];
      return nuevasAsignaciones;
    });
  };

  // Obtener docente asignado a una sección
  const getDocenteEnSeccion = (seccionId) => {
    return asignacionesPorSeccion[seccionId];
  };

  // Verificar si un docente está asignado a alguna sección
  const estaDocenteAsignado = (docenteId) => {
    return Object.values(asignacionesPorSeccion).some(docente => docente?.id === docenteId);
  };

  // Validar asignaciones
  const validarAsignaciones = () => {
    if (!fechaInicio || !fechaFin) {
      alert('Por favor selecciona ambas fechas');
      return false;
    }
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (inicio > fin) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin');
      return false;
    }
    
    if (!cursoSeleccionado) {
      alert('Por favor selecciona un curso');
      return false;
    }
    
    if (Object.keys(asignacionesPorSeccion).length === 0) {
      alert('Por favor asigna al menos un docente a una sección');
      return false;
    }
    
    return true;
  };

  // Obtener el período formateado
  // Obtener el período formateado
const obtenerPeriodo = () => {
  // Versión SIMPLE: solo "VERANO 2026-0" sin fechas
  return 'VERANO 2026-0';
  
  // (Comenta o elimina todo el código de fechas)
  /*
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  const formatoFecha = (fecha) => {
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  return `${formatoFecha(inicio)} al ${formatoFecha(fin)}`;
  */
};

  // Guardar asignación en localStorage
  const guardarAsignacion = () => {
    const asignacion = {
      id: `asig_${Date.now()}`,
      periodo: 'VERANO 2026-0',
      curso: cursoSeleccionado,
      fechaInicio,
      fechaFin,
      periodoFormateado: obtenerPeriodo(),
      fechaAsignacion: new Date().toISOString(),
      secciones: Object.entries(asignacionesPorSeccion).map(([seccionId, docente]) => {
    const seccion = cursoCompleto.secciones.find(s => s.id === seccionId);
    return {
      seccionId,
      seccion: seccion?.seccion || 'Sin sección',
      turno: seccion?.turno || 'No especificado',
      dias: seccion?.dias || '',
      horario: seccion?.horario || '',
      horarioCompleto: seccion?.horarioCompleto || '',
      enlace: seccion?.enlace || '', // AGREGAR ENLACE AQUÍ
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

      // Guardar en localStorage como respaldo
      const asignacionesExistentes = JSON.parse(localStorage.getItem('asignacionesCursos') || '[]');
      asignacionesExistentes.push(asignacion);
      localStorage.setItem('asignacionesCursos', JSON.stringify(asignacionesExistentes));

      // Añadir inmediatamente al estado que muestra el historial (si está cargado)
      try {
        if (typeof setAsignacionesGuardadas === 'function') {
          setAsignacionesGuardadas(prev => [asignacion, ...(prev || [])]);
        }
      } catch (err) {
        // no crítico, solo log
        console.debug('No se pudo actualizar estado asignacionesGuardadas inmediatamente:', err);
      }

      // Intentar guardar en Firestore
      (async () => {
        try {
          const docRef = await addDoc(collection(db, 'asignaciones'), asignacion);
          console.log('✅ Asignación guardada en Firestore, id:', docRef.id);
        } catch (err) {
          console.error('❌ Error guardando asignación en Firestore:', err);
        }
      })();

      console.log('📋 Asignación guardada (local):', asignacion);
      return asignacion;
    };

    // Estado para asignaciones guardadas en Firestore (por curso)
    const [asignacionesGuardadas, setAsignacionesGuardadas] = useState([]);
    // Filtro por fecha (YYYY-MM-DD) para ver historial en una fecha específica
    const [fechaFiltro, setFechaFiltro] = useState('');

    // Cargar asignaciones guardadas para el curso seleccionado
    useEffect(() => {
      if (!cursoSeleccionado) {
        setAsignacionesGuardadas([]);
        return;
      }

      let mounted = true;
      (async () => {
        try {
          const q = query(collection(db, 'asignaciones'), where('curso', '==', cursoSeleccionado), orderBy('fechaAsignacion', 'desc'));
          const snap = await getDocs(q);
          if (!mounted) return;
          const datos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAsignacionesGuardadas(datos);
        } catch (err) {
          console.error('Error cargando asignaciones desde Firestore:', err);
          setAsignacionesGuardadas([]);
        }
      })();

      return () => { mounted = false; };
    }, [cursoSeleccionado]);


  // Enviar correos a los docentes asignados usando EmailJS
  const enviarCorreos = async () => {
  if (!validarAsignaciones()) {
    console.log('❌ Validación fallida');
    return;
  }
  
  setEnviandoCorreos(true);
  const resultados = [];
  let exitosos = 0;
  let fallidos = 0;

  try {
    console.group('🚀 INICIANDO ENVÍO DE CORREOS USS');
    console.log('📌 Curso seleccionado:', cursoSeleccionado);
    console.log('👨‍🏫 Total de docentes asignados:', Object.keys(asignacionesPorSeccion).length);
    
    const asignacion = guardarAsignacion();
    console.log('💾 Asignación guardada con ID:', asignacion.id);
    console.log('📋 Secciones a procesar:', asignacion.secciones.length);

    const EMAILJS_CONFIG = {
      SERVICE_ID: 'service_4cy4ve1',
      TEMPLATE_ID: 'template_6oiipvk',
      PUBLIC_KEY: 'MhLednlk47LyghD7y'
    };
    
    console.log('🔐 Configuración EmailJS:', EMAILJS_CONFIG);

    // 🎯 CORREOS EXTRA PARA ENVIAR
    const correosExtra = ['paccis@uss.edu.pe', 'jefe.cis@uss.edu.pe'];

    for (const [index, seccionInfo] of asignacion.secciones.entries()) {
      const docente = seccionInfo.docente;
      const numeroSeccion = index + 1;
      
      console.group(`📧 [${numeroSeccion}/${asignacion.secciones.length}] Procesando: ${docente.nombre}`);
      console.log('📄 Información del docente:', {
        nombre: docente.nombre,
        correoUSS: docente.correoInstitucional,
        tieneCorreo: !!docente.correoInstitucional,
        celular: docente.celular || 'No registrado'
      });
      console.log('🏫 Información de la sección:', {
        seccion: seccionInfo.seccion,
        turno: seccionInfo.turno,
        dias: seccionInfo.dias,
        horario: seccionInfo.horario,
        modalidad: seccionInfo.modalidad
      });
      console.log('📧 Enviando copias a:', correosExtra);

      if (!docente || !docente.correoInstitucional) {
        console.error('❌ DOCENTE SIN CORREO INSTITUCIONAL');
        const resultadoError = {
          docente: docente?.nombre || 'Desconocido',
          email: 'No tiene correo USS',
          success: false,
          message: 'El docente no tiene correo institucional registrado',
          seccion: seccionInfo.seccion,
          timestamp: new Date().toISOString()
        };
        
        resultados.push(resultadoError);
        fallidos++;
        console.groupEnd();
        continue;
      }

      try {
        // PARÁMETROS PARA EL CORREO
        const templateParams = {
  'email': docente.correoInstitucional,
  'name': 'Centro de Informática USS',
  'periodo': 'VERANO 2026-0',
  'jborinodr': 'VERANO 2026-0',
  'to_email': docente.correoInstitucional,
  'docente_nombre': docente.nombre,
  'curso': cursoSeleccionado,
  'nombre_curso': cursoSeleccionado, // Para template nuevo
  'modalidad': seccionInfo.modalidad,
  'seccion': seccionInfo.seccion,
  'dias': seccionInfo.dias,
  'horario': seccionInfo.horario,
  'enlace_aula': seccionInfo.enlace || 'https://www.aulauss.edu.pe', // AGREGAR ENLACE
  
  // Para template viejo
  'title': `Asignación de Curso: ${cursoSeleccionado} - ${seccionInfo.seccion}`, // CAMBIADO: Sin "VERANO 2026-0"
  'fnombre, docente': docente.nombre,
  'jbonime, cursos': `${cursoSeleccionado} - ${seccionInfo.seccion}`, // CURSO + SECCIÓN
  'imodalidadi': seccionInfo.modalidad,
  'feccioni': seccionInfo.seccion,
  'díasi': seccionInfo.dias,
  'librario': seccionInfo.horario,
  
  // VARIABLES ADICIONALES
  'subject': `Asignación: ${cursoSeleccionado} - ${seccionInfo.seccion}`, // CAMBIADO: Sin "VERANO 2026-0"
  'reply_to': docente.correoInstitucional,
  'from_email': 'usscentroinformatica@gmail.com',
  'asignacion_id': asignacion.id,
  'fecha_asignacion': new Date().toLocaleDateString('es-PE'),
  
  // NUEVAS VARIABLES PARA EL TEMPLATE
  'curso_completo': `${cursoSeleccionado} ${seccionInfo.seccion}`,
  'enlace_curso': seccionInfo.enlace || 'https://www.aulauss.edu.pe',
  'info_acceso': `Acceda al curso aquí: ${seccionInfo.enlace || 'https://www.aulauss.edu.pe'}`
};

        console.log('🎯 Enviando correo principal a:', docente.correoInstitucional);

        // 📧 1. ENVIAR AL DOCENTE
        const response = await emailjs.send(
          EMAILJS_CONFIG.SERVICE_ID,
          EMAILJS_CONFIG.TEMPLATE_ID,
          templateParams,
          EMAILJS_CONFIG.PUBLIC_KEY
        );

        resultados.push({
          docente: docente.nombre,
          email: docente.correoInstitucional,
          success: true,
          message: 'Correo enviado al docente',
          seccion: seccionInfo.seccion,
          responseId: response.text,
          timestamp: new Date().toISOString()
        });
        exitosos++;

        console.log('✅ Correo enviado al docente');

        // 📧 2. ENVIAR A LOS CORREOS EXTRA
        for (const correoExtra of correosExtra) {
          try {
            const paramsExtra = {
              ...templateParams,
              'email': correoExtra,
              'subject': `[COPIA] ${templateParams.subject}`
            };

            await emailjs.send(
              EMAILJS_CONFIG.SERVICE_ID,
              EMAILJS_CONFIG.TEMPLATE_ID,
              paramsExtra,
              EMAILJS_CONFIG.PUBLIC_KEY
            );

            resultados.push({
              docente: `${docente.nombre} → ${correoExtra}`,
              email: correoExtra,
              success: true,
              message: 'Copia enviada',
              seccion: seccionInfo.seccion,
              timestamp: new Date().toISOString()
            });
            exitosos++;

            console.log(`✅ Copia enviada a: ${correoExtra}`);

          } catch (error) {
            resultados.push({
              docente: `${docente.nombre} → ${correoExtra}`,
              email: correoExtra,
              success: false,
              message: error.text || 'Error',
              seccion: seccionInfo.seccion,
              timestamp: new Date().toISOString()
            });
            fallidos++;

            console.error(`❌ Error con ${correoExtra}:`, error);
          }
        }

      } catch (error) {
        console.error('❌ ERROR con el docente:', error);

        const resultadoError = {
          docente: docente.nombre,
          email: docente.correoInstitucional,
          success: false,
          message: error.text || 'Error',
          seccion: seccionInfo.seccion,
          errorCode: error.status,
          timestamp: new Date().toISOString()
        };
        
        resultados.push(resultadoError);
        fallidos++;
      }
      
      console.groupEnd();
      
      if (index < asignacion.secciones.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setCorreosEnviados(resultados);
    
    console.group('📊 RESUMEN FINAL DEL ENVÍO');
    console.log('✅ Exitosos:', exitosos);
    console.log('❌ Fallidos:', fallidos);
    console.log('📋 Total procesados:', resultados.length);
    console.groupEnd();

    // Mostrar mensaje simple
    alert(`📧 ENVÍOS COMPLETADOS
✅ Exitosos: ${exitosos}
❌ Fallidos: ${fallidos}

Se envió a cada docente + paccis@uss.edu.pe + jefe.cis@uss.edu.pe`);

    if (exitosos > 0 && onAsignacionCompletada) {
      onAsignacionCompletada();
    }

  } catch (error) {
    console.error('💥 ERROR:', error);
    alert('❌ Error en el proceso');
  } finally {
    setEnviandoCorreos(false);
  }
};

  // Exportar asignaciones a Excel
  const exportarAsignacionesAExcel = () => {
    const asignacionesGuardadas = JSON.parse(localStorage.getItem('asignacionesCursos') || '[]');
    
    if (asignacionesGuardadas.length === 0) {
      alert('No hay asignaciones para exportar');
      return;
    }

    const datosExcel = asignacionesGuardadas.flatMap(asignacion => 
      asignacion.secciones.map(seccionInfo => ({
        'PERIODO': asignacion.periodo,
        'FECHAS': asignacion.periodoFormateado,
        'CURSO': asignacion.curso,
        'SECCIÓN': seccionInfo.seccion,
        'TURNO': seccionInfo.turno,
        'DÍAS': seccionInfo.dias,
        'HORARIO': seccionInfo.horario,
        'MODALIDAD': seccionInfo.modalidad,
        'DOCENTE': seccionInfo.docente.nombre,
        'CORREO INSTITUCIONAL': seccionInfo.docente.correoInstitucional || '',
        'CORREO PERSONAL': seccionInfo.docente.correoPersonal || '',
        'CELULAR': seccionInfo.docente.celular || '',
        'DNI': seccionInfo.docente.dni || '',
        'FECHA ASIGNACIÓN': new Date(asignacion.fechaAsignacion).toLocaleDateString('es-PE')
      }))
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    ws['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 30 },
      { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Asignaciones_Verano2026');
    const fecha = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    const nombreArchivo = `Asignaciones_Verano2026_${fecha}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl mx-auto max-h-[95vh] overflow-y-auto border border-gray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center text-white">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold">🏖️ ASIGNAR CURSO - VERANO 2026-0</h3>
            <p className="text-xs sm:text-sm opacity-90 mt-1">
              Asigna diferentes docentes por sección • Correo USS configurado
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
          >
            <FiX size={12} className="sm:size-12" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Información de EmailJS */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/USS_Logo.png/640px-USS_Logo.png" 
                alt="USS Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <p className="text-sm font-bold text-blue-800">Universidad Señor de Sipán - Centro de Informática</p>
                <p className="text-xs text-blue-700 mt-1">
                  Los correos se enviarán al correo institucional con el formato de la USS.
                </p>
              </div>
            </div>
          </div>

          {/* Sección 1: Configuración general del curso */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiCalendar className="text-blue-600" />
              Configuración del Periodo y Curso
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Curso */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Curso *
                </label>
                <select
                  value={cursoSeleccionado}
                  onChange={(e) => {
                    setCursoSeleccionado(e.target.value);
                    setAsignacionesPorSeccion({}); // Limpiar asignaciones al cambiar curso
                  }}
                  className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecciona un curso</option>
                  {cursosVerano2026.map((curso) => (
                    <option key={curso.id} value={curso.nombre}>
                      {curso.nombre} ({curso.secciones.length} sección{curso.secciones.length !== 1 ? 'es' : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha Inicio */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  min="2026-01-05"
                  max="2026-02-15"
                  className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Fecha Fin */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  min={fechaInicio || "2026-01-05"}
                  max="2026-02-28"
                  className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Vista previa del período */}
            {fechaInicio && fechaFin && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-800">📅 Periodo configurado:</p>
                <p className="text-sm text-blue-700 mt-1">{obtenerPeriodo()}</p>
                <p className="text-xs text-blue-600 mt-1">(Este período aparecerá en el correo enviado a los docentes)</p>
              </div>
            )}
          </div>

          {/* Sección 2: Asignación por secciones */}
          {cursoCompleto && (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FiUserCheck className="text-purple-600" />
                  Asignación por Secciones ({Object.keys(asignacionesPorSeccion).length} asignadas)
                </h4>
                
                <button
                  onClick={exportarAsignacionesAExcel}
                  className="flex items-center gap-1 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors"
                >
                  <FiDownload size={14} />
                  <span>Exportar Excel</span>
                </button>
              </div>

              {/* Lista de secciones del curso */}
              <div className="space-y-4">
                {cursoCompleto.secciones.map((seccion) => {
                  const docenteAsignado = getDocenteEnSeccion(seccion.id);
                  
                  return (
                    <div key={seccion.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                        <div>
                          <h5 className="font-bold text-gray-800">{seccion.seccion} - {seccion.turno}</h5>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <FiCalendar size={12} />
                            <span>{seccion.dias}</span>
                            <FiClock size={12} className="ml-2" />
                            <span>{seccion.horario}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {docenteAsignado ? (
                            <>
                              <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                ✅ Asignado
                              </div>
                              <button
                                onClick={() => quitarDocenteDeSeccion(seccion.id)}
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Cambiar
                              </button>
                            </>
                          ) : (
                            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              ⏳ Sin asignar
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Información del docente asignado */}
                      {docenteAsignado && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-green-800">{docenteAsignado.nombre}</p>
                              <div className="flex items-center gap-2 text-xs text-green-700 mt-1">
                                <FiMail size={10} />
                                <span className="font-semibold">{docenteAsignado.correoInstitucional || 'Sin correo USS'}</span>
                              </div>
                              {!docenteAsignado.correoInstitucional && (
                                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                  <FiAlertCircle size={10} />
                                  <span>¡Atención! Este docente no recibirá el correo de asignación</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {docenteAsignado.celular && `📱 ${docenteAsignado.celular}`}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Buscador de docentes para esta sección */}
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder={`Buscar docente para ${seccion.seccion}...`}
                          value={filtroNombre}
                          onChange={(e) => setFiltroNombre(e.target.value)}
                          className="w-full text-sm border rounded-lg px-3 py-2 border-gray-300 bg-white"
                        />
                      </div>

                      {/* Lista de docentes disponibles para esta sección */}
                      <div className="max-h-40 overflow-y-auto pr-2">
                        {docentesFiltrados.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-2">No se encontraron docentes</p>
                        ) : (
                          docentesFiltrados.map((docente) => {
                            const estaAsignado = estaDocenteAsignado(docente.id);
                            const esAsignadoAEstaSeccion = docenteAsignado?.id === docente.id;
                            const tieneCorreoUSS = !!docente.correoInstitucional;
                            
                            return (
                              <div
                                key={docente.id}
                                onClick={() => !estaAsignado || esAsignadoAEstaSeccion ? asignarDocenteASeccion(seccion.id, docente) : null}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                                  esAsignadoAEstaSeccion
                                    ? 'bg-blue-100 border border-blue-300'
                                    : estaAsignado
                                    ? 'bg-gray-100 border border-gray-300 opacity-50 cursor-not-allowed'
                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                                } ${!tieneCorreoUSS ? 'border-l-4 border-l-red-400' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    esAsignadoAEstaSeccion
                                      ? 'bg-blue-500 text-white'
                                      : estaAsignado
                                      ? 'bg-gray-400 text-white'
                                      : 'bg-gray-200 text-gray-600'
                                  }`}>
                                    {esAsignadoAEstaSeccion ? '✓' : estaAsignado ? '✗' : '+'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{docente.nombre}</p>
                                    <div className="flex items-center gap-1 text-xs">
                                      <FiMail size={10} className={tieneCorreoUSS ? "text-green-500" : "text-red-500"} />
                                      <span className={tieneCorreoUSS ? "text-gray-500" : "text-red-500"}>
                                        {docente.correoInstitucional || 'Sin correo USS'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {estaAsignado && !esAsignadoAEstaSeccion && (
                                  <span className="text-xs text-gray-500">Asignado a otra sección</span>
                                )}
                                {!tieneCorreoUSS && (
                                  <span className="text-xs text-red-500">Sin correo</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumen de asignaciones */}
          {Object.keys(asignacionesPorSeccion).length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-purple-200">
              <h4 className="text-lg font-bold text-purple-800 mb-3">📋 Resumen de Asignaciones</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(asignacionesPorSeccion).map(([seccionId, docente]) => {
                  const seccion = cursoCompleto?.secciones.find(s => s.id === seccionId);
                  const tieneCorreoUSS = !!docente.correoInstitucional;
                  
                  return (
                    <div key={seccionId} className={`p-3 bg-white rounded-lg border ${tieneCorreoUSS ? 'border-purple-100' : 'border-red-200'} shadow-sm`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-purple-700">{seccion?.seccion || 'Sección'}</p>
                          <p className="text-xs text-gray-600">{seccion?.turno}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tieneCorreoUSS ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <FiMail className={tieneCorreoUSS ? "text-green-600" : "text-red-600"} size={14} />
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-800">{docente.nombre}</p>
                        <p className={`text-xs truncate ${tieneCorreoUSS ? 'text-gray-500' : 'text-red-500 font-semibold'}`}>
                          {docente.correoInstitucional || '⚠️ Sin correo USS'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <FiCalendar size={10} />
                          <span>{seccion?.dias}</span>
                          <FiClock size={10} />
                          <span>{seccion?.horario}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Listado de asignaciones guardadas en Firebase */}
          {asignacionesGuardadas && asignacionesGuardadas.length > 0 && (
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-gray-800">📚 Asignaciones guardadas (Firestore)</h4>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Filtrar por fecha:</label>
                  <input
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  />
                  <button onClick={() => setFechaFiltro('')} className="text-xs px-2 py-1 bg-gray-100 rounded">Limpiar</button>
                </div>
              </div>

              <div className="space-y-3">
                {(
                  // Si hay filtro, mostrar solo las asignaciones con la misma fecha (fechaAsignacion YYYY-MM-DD)
                  (fechaFiltro ? asignacionesGuardadas.filter(a => a.fechaAsignacion && a.fechaAsignacion.slice(0,10) === fechaFiltro) : asignacionesGuardadas)
                ).map(a => (
                  <div key={a.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{a.curso} • {a.periodo}</p>
                        <p className="text-xs text-gray-500">Guardado: {new Date(a.fechaAsignacion).toLocaleString('es-PE')}</p>
                      </div>
                      <div className="text-xs text-gray-600">{a.secciones?.length || 0} sección(es)</div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {a.secciones && a.secciones.map((s, idx) => (
                        <div key={idx} className="p-2 bg-white rounded border border-gray-100">
                          <p className="text-sm font-medium text-gray-700">{s.seccion} • {s.turno}</p>
                          <p className="text-xs text-gray-500">{s.docente?.nombre || 'Sin docente'}</p>
                          <p className="text-xs text-gray-500 truncate">{s.docente?.correoInstitucional || s.docente?.correoPersonal || 'Sin correo'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={enviarCorreos}
              disabled={enviandoCorreos || Object.keys(asignacionesPorSeccion).length === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-800 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {enviandoCorreos ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando correos USS...
                </>
              ) : (
                <>
                  <FiSend size={16} />
                  Asignar y Enviar Correos
                </>
              )}
            </button>
          </div>

          {/* Resultados de envío de correos */}
          {correosEnviados.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FiMail className="text-blue-600" />
                  Resultados del envío de correos USS
                </h5>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    ✅ {correosEnviados.filter(r => r.success).length} exitosos
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    ❌ {correosEnviados.filter(r => !r.success).length} fallidos
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {correosEnviados.map((resultado, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      resultado.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-1 ${resultado.success ? 'text-green-600' : 'text-red-600'}`}>
                        {resultado.success ? '✅' : '❌'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-800">{resultado.docente}</p>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {resultado.seccion}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{resultado.email}</p>
                        <p className={`text-xs mt-1 ${resultado.success ? 'text-green-700' : 'text-red-700'}`}>
                          {resultado.success ? 'Correo USS enviado correctamente' : resultado.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default ModalAsignarCurso;
