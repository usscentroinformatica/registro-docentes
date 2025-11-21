// src/components/ModalDocente.jsx
import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { FiX, FiDownload, FiSend } from 'react-icons/fi';

const ModalDocente = ({ docente, onClose }) => {
  // Inicializar EmailJS
  React.useEffect(() => {
    emailjs.init('MhLednlk47LyghD7y');
  }, []);

  const [showMailModal, setShowMailModal] = useState(false);
  const [mailData, setMailData] = useState({ asunto: '', mensaje: '', destinatario: '', curso: null });

  const handleOpenMailModal = (destinatario, curso) => {
    setMailData({
      asunto: `Asignación sobre el curso ${curso.curso} (${curso.seccion})`,
      mensaje: `Hola ${docente.nombre},\n\nMe comunico respecto al curso ${curso.curso} (${curso.seccion}).`,
      destinatario,
      curso
    });
    setShowMailModal(true);
  };

  const handleSendMail = async () => {
    try {
      const templateId = 'template_6oiipvk';
      const periodo = 'Noviembre 2025 II';
      const modalidad = 'Virtual';

      if (docente.correoInstitucional) {
        // Correo al docente
        await emailjs.send('service_ka6bpim', templateId, {
          nombre_docente: docente.nombre,
          email: docente.correoInstitucional,
          nombre_curso: mailData.curso.curso,
          periodo,
          modalidad,
          seccion: mailData.curso.seccion,
          dias: mailData.curso.dias,
          horario: `${mailData.curso.horaInicio} - ${mailData.curso.horaFin}`,
          title: mailData.asunto,
          message: mailData.mensaje
        });

        // Copia a coordinación
        await emailjs.send('service_ka6bpim', templateId, {
          nombre_docente: docente.nombre,
          email: 'paccis@uss.edu.pe',
          nombre_curso: mailData.curso.curso,
          periodo,
          modalidad,
          seccion: mailData.curso.seccion,
          dias: mailData.curso.dias,
          horario: `${mailData.curso.horaInicio} - ${mailData.curso.horaFin}`,
          title: mailData.asunto,
          message: mailData.mensaje
        });

        alert('¡Correo enviado exitosamente!');
      } else {
        alert('El docente no tiene correo institucional registrado.');
      }
    } catch (error) {
      alert('Error al enviar el correo. Intenta de nuevo.');
      console.error('Error:', error);
    }
    setShowMailModal(false);
  };

  if (!docente) return null;

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'No especificada';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad > 0 ? `${edad} años` : 'Edad no válida';
  };

  const handleDownload = () => {
    const placeholder = 'https://placehold.co/320x320?text=Sin+Foto';
    if (docente.foto && docente.foto.trim() !== placeholder) {
      const link = document.createElement('a');
      link.href = docente.foto;
      link.download = `foto_${docente.nombre.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No hay imagen disponible para descargar.');
    }
  };

  const placeholderUrl = 'https://placehold.co/320x320?text=Sin+Foto';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center text-white">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold">Detalles del Docente</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">{docente.nombre}</p>
            </div>
            <button onClick={onClose} className="p-1 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200">
              <FiX size={28} />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Columna izquierda - Datos personales */}
              <div className="space-y-4 sm:space-y-6">
                {/* Todos los campos que ya tenías... */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Nombre completo</label>
                  <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">{docente.nombre}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Género</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.genero || 'No especificado'}</p>
                </div>
                {/* ... (el resto de campos: edad, DNI, celular, correos, grados, etc.) */}
                {/* Horarios disponibles */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-amber-600">📅</span>
                    Ciclo Intensivo Noviembre - Horarios Disponibles
                  </label>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border-2 border-amber-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {docente.horariosDisponibles || 'No especificados'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Columna derecha - Foto + Tabla de cursos asignados */}
              <div className="flex flex-col items-center space-y-6">
                {/* Foto */}
                <div className="flex flex-col items-end space-y-2">
                  <img
                    src={docente.foto && docente.foto.trim() !== placeholderUrl ? docente.foto : placeholderUrl}
                    alt={docente.nombre}
                    className="w-48 h-48 sm:w-80 sm:h-80 object-contain bg-gray-50 rounded-xl shadow-md border border-gray-200"
                    onError={(e) => { e.target.src = placeholderUrl; }}
                  />
                  {docente.foto && docente.foto.trim() !== placeholderUrl && (
                    <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs">
                      <FiDownload size={14} /> Descargar
                    </button>
                  )}
                </div>

                {/* TABLA DE CURSOS ASIGNADOS - LÓGICA CORREGIDA */}
                {(() => {
                  let cursosPorDocente = [];
                  try {
                    cursosPorDocente = require('../data/cursosPorDocente').default;
                  } catch (e) { }

                  const normalizar = (str) => (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().trim();

                  const nombreDB = normalizar(docente.nombre); // ej: "ESTRELLA DEISSY"

                  const cursos = cursosPorDocente.filter(c => {
                    const nombreExcel = normalizar(c.docente); // ej: "TICONA TAPIA ESTRELLA"

                    // REGLA ESPECIAL PARA ESTRELLA (y cualquier docente con apellido/nombre poco común)
                    const tieneEstrellaDB = nombreDB.includes('ESTRELLA');
                    const tieneEstrellaExcel = nombreExcel.includes('ESTRELLA');

                    if (tieneEstrellaDB || tieneEstrellaExcel) {
                      return tieneEstrellaDB && tieneEstrellaExcel;
                    }

                    // Para todos los demás: mínimo 2 palabras coincidentes
                    const palabrasDB = nombreDB.split(/\s+/);
                    const palabrasExcel = nombreExcel.split(/\s+/);
                    const coincidencias = palabrasExcel.filter(p => palabrasDB.includes(p));

                    const diasValido = typeof c.dias === 'string' ? !c.dias.toUpperCase().includes('ALMUERZO') : true;

                    return coincidencias.length >= 2 && diasValido;
                  });

                  if (cursos.length === 0) return null;

                  return (
                    <div className="mt-6 w-full max-w-lg mx-auto">
                      <h4 className="text-sm font-bold text-blue-700 mb-3 text-center">Ciclo Intensivo Noviembre 2025</h4>
                      <div className="overflow-x-auto rounded-xl shadow border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-blue-200 text-blue-900">
                              <th className="px-2 py-2">Curso</th>
                              <th className="px-2 py-2">Sección</th>
                              <th className="px-2 py-2">Turno</th>
                              <th className="px-2 py-2">Días</th>
                              <th className="px-2 py-2">Inicio</th>
                              <th className="px-2 py-2">Fin</th>
                              <th className="px-2 py-2 text-center">Correo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cursos.map((curso, idx) => (
                              <tr key={idx} className="bg-white even:bg-blue-50 hover:bg-blue-100">
                                <td className="px-2 py-2">{curso.curso}</td>
                                <td className="px-2 py-2">{curso.seccion}</td>
                                <td className="px-2 py-2">{curso.turno}</td>
                                <td className="px-2 py-2">{curso.dias}</td>
                                <td className="px-2 py-2">{curso.horaInicio}</td>
                                <td className="px-2 py-2">{curso.horaFin}</td>
                                <td className="px-2 py-2 text-center">
                                  <button
                                    onClick={() => handleOpenMailModal(docente.correoInstitucional, curso)}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    title="Enviar correo"
                                  >
                                    <FiSend size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de envío de correo */}
      {showMailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-blue-200">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Enviar correo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Para:</label>
                <input type="text" value={`${mailData.destinatario}, paccis@uss.edu.pe`} disabled className="w-full border-2 border-gray-200 rounded-xl p-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Asunto:</label>
                <input type="text" value={mailData.asunto} onChange={e => setMailData({ ...mailData, asunto: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl p-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje:</label>
                <textarea rows={5} value={mailData.mensaje} onChange={e => setMailData({ ...mailData, mensaje: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl p-2" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowMailModal(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
                <button onClick={handleSendMail} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enviar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalDocente;
