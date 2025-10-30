import React, { useState } from 'react';
import { FiEye, FiEdit3, FiMail, FiBook, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const ResultadosBusqueda = ({ resultados, onSeleccionarDocente, onEditarDocente }) => {
  const [orden, setOrden] = useState('default');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroGrado, setFiltroGrado] = useState('');

  // Función para obtener el primer apellido
  const getApellido = (nombreCompleto) => {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length <= 1) return partes[0].toLowerCase();
    if (partes.length === 2) return partes[1].toLowerCase();
    // Para longitud >=3, el primer apellido es el penúltimo
    return partes[partes.length - 2].toLowerCase();
  };

  // Filtrar por curso, género y grado académico
  let resultadosFiltrados = [...resultados];
  if (filtroCurso) {
    resultadosFiltrados = resultadosFiltrados.filter(docente =>
      Array.isArray(docente.cursosDictados)
        ? docente.cursosDictados.includes(filtroCurso)
        : (typeof docente.cursosDictados === 'string' && docente.cursosDictados.includes(filtroCurso))
    );
  }
  if (filtroGenero) {
    resultadosFiltrados = resultadosFiltrados.filter(docente => docente.genero === filtroGenero);
  }
  if (filtroGrado) {
    resultadosFiltrados = resultadosFiltrados.filter(docente => docente.gradoAcademico === filtroGrado);
  }

  // Ordenar
  let resultadosOrdenados = [...resultadosFiltrados];
  if (orden === 'apellido') {
    resultadosOrdenados.sort((a, b) => {
      const apellidoA = getApellido(a.nombre);
      const apellidoB = getApellido(b.nombre);
      return apellidoA.localeCompare(apellidoB);
    });
  }

  // Función para exportar a Excel con todos los campos relevantes
  const exportarAExcel = () => {
    const datosExcel = resultadosOrdenados.map((docente, index) => ({
      'N°': index + 1,
      'Nombre Completo': docente.nombre,
      'DNI': docente.dni || '',
      'Fecha de Nacimiento': docente.fechaNacimiento || '',
      'Correo Personal': docente.correoPersonal || '',
      'Correo Institucional': docente.correoInstitucional || '',
      'Dirección': docente.direccion || '',
      'Celular': docente.celular || '',
      'Descripción': docente.descripcion || '',
      'Cursos': Array.isArray(docente.cursosDictados) ? docente.cursosDictados.join(', ') : docente.cursosDictados || '',
      'Horarios Disponibles': docente.horariosDisponibles || '',
      'Género': docente.genero || '',
      'Grado Académico': docente.gradoAcademico || '',
      'Magíster en': docente.magisterEn || '',
      'Doctorado en': docente.doctoradoEn || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
      { wch: 15 },
      { wch: 50 },
      { wch: 40 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Docentes');
    const fecha = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    const nombreArchivo = `Docentes_${fecha}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  if (resultados.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-gray-200 rounded-full mb-4">
          <FiBook className="text-gray-400" size={40} />
        </div>
        <p className="text-gray-500 text-base font-medium">No se encontraron docentes</p>
        <p className="text-gray-400 text-sm mt-2">Intenta con otra búsqueda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm font-semibold text-gray-600">
          {resultadosOrdenados.length} {resultadosOrdenados.length === 1 ? 'docente encontrado' : 'docentes encontrados'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por curso dictado */}
          <select
            value={filtroCurso}
            onChange={e => setFiltroCurso(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 border-gray-300 bg-white"
          >
            <option value="">Todos los cursos</option>
            <option value="AUTOCAD 2D">AUTOCAD 2D</option>
            <option value="AUTOCAD 3D">AUTOCAD 3D</option>
            <option value="BIZAGI">BIZAGI</option>
            <option value="DISEÑO CON CANVA">DISEÑO CON CANVA</option>
            <option value="DISEÑO WEB">DISEÑO WEB</option>
            <option value="EXCEL 365">EXCEL 365</option>
            <option value="EXCEL ASOCIADO">EXCEL ASOCIADO</option>
            <option value="POWER BI">POWER BI</option>
            <option value="PYTHON">PYTHON</option>
            <option value="WORD 365">WORD 365</option>
            <option value="WORD ASOCIADO">WORD ASOCIADO</option>
          </select>
          {/* Filtro por género */}
          <select
            value={filtroGenero}
            onChange={e => setFiltroGenero(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 border-gray-300 bg-white"
          >
            <option value="">Todos los géneros</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
          {/* Filtro por grado académico */}
          <select
            value={filtroGrado}
            onChange={e => setFiltroGrado(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 border-gray-300 bg-white"
          >
            <option value="">Todos los grados</option>
            <option value="Titulado">Titulado</option>
            <option value="Magíster">Magíster</option>
            <option value="Doctor">Doctor</option>
          </select>
          {/* Orden y exportar */}
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 border-gray-300 bg-white"
          >
            <option value="default">Orden predeterminado</option>
            <option value="apellido">Ordenar por apellido (A-Z)</option>
          </select>
          <button
            onClick={exportarAExcel}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold text-sm hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <FiDownload size={16} />
            <span>Exportar a Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resultadosOrdenados.map((docente) => (
          <div
            key={docente.id}
            className="group bg-white rounded-2xl shadow-md hover:shadow-2xl border-2 border-[#4682B4]/20 hover:border-[#4682B4] transition-all duration-300 overflow-hidden transform hover:-translate-y-1 ring-1 ring-gray-100"
          >
            {/* Header con foto de fondo difuminada */}
            <div className="relative h-32 bg-gradient-to-br from-[#4682B4] via-[#5A9BD4] to-[#6BA3D8] overflow-hidden border-b-2 border-[#4682B4]/30">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={docente.foto || 'https://placehold.co/96x96?text=Sin+Foto'}
                  alt={docente.nombre}
                  className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-xl transform group-hover:scale-110 transition-transform duration-300 ring-2 ring-[#4682B4]/30"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/96x96?text=Sin+Foto';
                  }}
                />
              </div>
            </div>

            {/* Contenido */}
            <div className="p-5 space-y-3">
              {/* Nombre */}
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-800 line-clamp-1 mb-1">
                  {docente.nombre}
                </h3>
                <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FiMail size={12} />
                    <span className="truncate">{docente.correoPersonal}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiMail size={12} />
                    <span className="truncate">{docente.correoInstitucional || 'Sin correo institucional'}</span>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-3 min-h-[80px]">
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {docente.descripcion}
                </p>
              </div>

              {/* Cursos (si existen) */}
              {docente.cursosDictados && (
                <div className="flex items-center gap-2 text-xs text-[#4682B4] bg-blue-50 px-3 py-2 rounded-lg">
                  <FiBook size={12} />
                  <span className="truncate font-medium">{docente.cursosDictados}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeleccionarDocente(docente);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#4682B4] to-[#5A9BD4] text-white rounded-xl font-semibold text-sm hover:from-[#3A6FA1] hover:to-[#4682B4] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  title="Ver Detalles"
                >
                  <FiEye size={16} />
                  <span>Ver</span>
                </button>
                {onEditarDocente && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditarDocente(docente);
                    }}
                    className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-sm hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    title="Editar"
                  >
                    <FiEdit3 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultadosBusqueda;
