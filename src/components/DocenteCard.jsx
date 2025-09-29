// src/components/DocenteCard.jsx
import React from 'react';

const DocenteCard = ({ docente }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <img
        src={docente.foto}
        alt={docente.nombre}
        className="w-full h-48 object-cover rounded-lg mb-4"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Foto';
        }}
      />
      <h3 className="text-xl font-semibold text-gray-800 mb-3">{docente.nombre}</h3>
      <p className="text-gray-600 mb-3">
        <strong className="text-gray-800">Email:</strong> {docente.email}
      </p>
      <p className="text-gray-600">
        <strong className="text-gray-800">Descripción:</strong> {docente.descripcion}
      </p>
    </div>
  );
};

export default DocenteCard;