import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { FiX, FiDownload, FiSend } from 'react-icons/fi';

const ModalDocente = ({ docente, onClose }) => {
  // Inicializar EmailJS solo una vez
  React.useEffect(() => {
    emailjs.init('MhLednlk47LyghD7y');
  }, []);
  // Estado para el modal de correo
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailData, setMailData] = useState({ asunto: '', mensaje: '', destinatario: '' });

  // Función para abrir el modal de correo
  const handleOpenMailModal = (destinatario, curso) => {
    setMailData({
      asunto: `Consulta sobre el curso ${curso.curso} (${curso.seccion})`,
      mensaje: `Hola ${docente.nombre},\n\nMe comunico respecto al curso ${curso.curso} (${curso.seccion}).`,
      destinatario,
      curso
    });
    setShowMailModal(true);
  };

  // Función para enviar el correo real con EmailJS
  const handleSendMail = async () => {
    try {
      const templateId = 'template_6oiipvk';
  const periodo = 'Noviembre 2025 II';
      // Si la sección contiene 'PEAD', la modalidad debe ser 'Virtual', si no, usar el valor original
      let modalidad = 'Presencial';
      if (mailData.curso.seccion && mailData.curso.seccion.toUpperCase().includes('PEAD')) {
        modalidad = 'Virtual';
      } else if (mailData.curso.seccion && mailData.curso.seccion.toUpperCase().includes('VIRTUAL')) {
        modalidad = 'Virtual';
      } else {
        modalidad = 'Presencial';
      }
      const seccion = mailData.curso.seccion;
      // Enviar al correo institucional del docente
      if (docente.correoInstitucional) {
        await emailjs.send(
          'service_ka6bpim',
          templateId,
          {
            nombre_docente: docente.nombre,
            email: docente.correoInstitucional, // Coincide con {{email}} en la plantilla
            nombre_curso: mailData.curso.curso,
            periodo,
            modalidad,
            seccion,
            title: mailData.asunto,
            message: mailData.mensaje
          }
        );
        // Enviar copia a paccis@uss.edu.pe
        await emailjs.send(
          'service_ka6bpim',
          templateId,
          {
            nombre_docente: docente.nombre,
            email: 'paccis@uss.edu.pe',
            nombre_curso: mailData.curso.curso,
            periodo,
            modalidad,
            seccion,
            title: mailData.asunto,
            message: mailData.mensaje
          }
        );
        alert('¡Correo enviado exitosamente!');
      } else {
        alert('El docente no tiene correo institucional registrado.');
      }
      alert('¡Correo enviado exitosamente!');
    } catch (error) {
      alert('Error al enviar el correo. Intenta de nuevo.');
      console.error('Error detallado:', error);
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
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
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

  // Limpiar el placeholder para comparación
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
            <button
              onClick={onClose}
              className="p-1 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
            >
              <FiX size={12} className="sm:size-12" />
            </button>
          </div>
          
          {/* Contenido */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-4 sm:space-y-6 relative">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Nombre completo</label>
                  <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">{docente.nombre}</p>
                </div>
                {/* Género */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Género</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.genero || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Fecha de nacimiento</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.fechaNacimiento || 'No especificada'}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Edad</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 font-medium">
                    {calcularEdad(docente.fechaNacimiento)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">DNI</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.dni || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Número de celular</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.celular || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Correo personal</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.correoPersonal || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Correo institucional</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.correoInstitucional || 'No especificado'}</p>
                </div>
                {/* Grado académico */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Grado académico</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.gradoAcademico || 'No especificado'}</p>
                </div>
                {/* Magíster en... solo si aplica */}
                {docente.gradoAcademico === 'Magíster' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Magíster en...</label>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.magisterEn || 'No especificado'}</p>
                  </div>
                )}
                {/* Doctorado en... solo si aplica */}
                {docente.gradoAcademico === 'Doctor' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Doctorado en...</label>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.doctoradoEn || 'No especificado'}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Dirección</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">{docente.direccion || 'No especificada'}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Descripción</label>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap leading-relaxed">{docente.descripcion}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Cursos</label>
                    {Array.isArray(docente.cursosDictados) && docente.cursosDictados.length > 0 ? (
                      <ul className="list-disc pl-5 text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                        {docente.cursosDictados.map((curso, idx) => (
                          <li key={idx}>{curso}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">No especificados</p>
                    )}
                </div>

                {/* ✅ NUEVO: Horarios Disponibles - Ciclo Intensivo Noviembre */}
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
              <div className="flex flex-col items-center space-y-4">
                <div className="flex flex-col items-end space-y-2">
                  <img
                    src={docente.foto && docente.foto.trim() !== placeholderUrl ? docente.foto : placeholderUrl}
                    alt={docente.nombre}
                    className="w-48 h-48 sm:w-80 sm:h-80 object-contain bg-gray-50 rounded-xl shadow-md border border-gray-200 ml-auto"
                    style={{ marginRight: '0' }}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/320x320?text=Sin+Foto';
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 font-medium text-right">Foto de perfil</p>
                  {/* Botón descargar imagen */}
                  {docente.foto && docente.foto.trim() !== placeholderUrl && (
                    <button
                      onClick={handleDownload}
                      className="mt-2 flex items-center space-x-2 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs font-medium ml-auto"
                    >
                      <FiDownload size={12} />
                      <span>Descargar</span>
                    </button>
                  )}
                </div>
                {/* Tabla de cursos asignados desde Excel */}
                {(() => {
                  // Importar los cursos solo una vez
                  let cursosPorDocente;
                  try {
                    // eslint-disable-next-line
                    cursosPorDocente = require('../data/cursosPorDocente').default;
                  } catch (e) {
                    cursosPorDocente = [];
                  }
                  // Normalizar y dividir nombres en arrays de palabras
                  const normalizar = (str) => (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().split(/\s+/).filter(Boolean);
                  const nombreDocenteArr = normalizar(docente.nombre);
                  // Coincidencia: al menos 3 palabras iguales entre ambos nombres (mejora para evitar falsos positivos como hermanos con apellidos compartidos)
                  const cursos = cursosPorDocente.filter(c => {
                    const nombreExcelArr = normalizar(c.docente);
                    const coincidencias = nombreExcelArr.filter(n => nombreDocenteArr.includes(n));
                    return coincidencias.length >= 3;
                  });
                  if (cursos.length === 0) return null;
                  return (
                    <div className="mt-4 w-full max-w-lg mx-auto">
                      <h4 className="text-sm font-bold text-blue-700 mb-2 text-center">Ciclo Intensivo Noviembre 2025</h4>
                      <div className="overflow-x-auto rounded-xl shadow border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                        <table className="w-full text-xs rounded-xl">
                          <thead>
                            <tr className="bg-blue-200 text-blue-900">
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Curso</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Sección</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Turno</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Días</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Inicio</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold">Fin</th>
                              <th className="px-2 py-1 border-b border-blue-300 font-semibold text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cursos.map((curso, idx) => (
                              <tr key={idx} className="bg-white even:bg-blue-50 hover:bg-blue-100 transition-all">
                                <td className="px-2 py-1 border-b border-blue-100">{curso.curso}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.seccion}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.turno}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.dias}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.horaInicio}</td>
                                <td className="px-2 py-1 border-b border-blue-100">{curso.horaFin}</td>
                                <td className="px-2 py-1 border-b border-blue-100 text-center">
                                  <button
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition-all text-xs"
                                    title="Enviar correo"
                                    onClick={() => handleOpenMailModal(docente.correoInstitucional, curso)}
                                  >
                                    <FiSend size={14} />
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
      {/* Modal para enviar correo (movido fuera del contenido principal para mejor estructura) */}
      {showMailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-blue-200">
            <h3 className="text-lg font-bold text-blue-700 mb-4">Enviar correo</h3>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Para:</label>
              <input
                type="text"
                value={`${mailData.destinatario}, paccis@uss.edu.pe`}
                disabled
                className="w-full border-2 border-gray-200 rounded-xl p-2 bg-gray-100 text-gray-700"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Asunto:</label>
              <input
                type="text"
                value={mailData.asunto}
                onChange={e => setMailData({ ...mailData, asunto: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl p-2"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje:</label>
              <textarea
                rows={4}
                value={mailData.mensaje}
                onChange={e => setMailData({ ...mailData, mensaje: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl p-2"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                onClick={() => setShowMailModal(false)}
              >Cancelar</button>
              <button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-600"
                onClick={handleSendMail}
              >Enviar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalDocente;