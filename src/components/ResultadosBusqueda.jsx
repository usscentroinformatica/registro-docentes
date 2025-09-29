// src/components/ResultadosBusqueda.jsx
import React from 'react';

const ResultadosBusqueda = ({ resultados, onSeleccionarDocente }) => {
  if (resultados.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No se encontraron docentes. ¡Prueba otra búsqueda!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-row overflow-x-auto gap-4 mt-6 pb-2 scrollbar-hide">
      {resultados.map((docente) => (
        <div
          key={docente.id}
          onClick={() => onSeleccionarDocente(docente)}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200 flex items-center space-x-4 min-w-max flex-shrink-0"
        >
          <img
            src={docente.foto}
            alt={docente.nombre}
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/64x64?text=SF';
            }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{docente.nombre}</h3>
            <p className="text-xs text-gray-500 truncate">{docente.correoPersonal}</p>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{docente.descripcion}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultadosBusqueda;