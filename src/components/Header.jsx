// src/components/Header.jsx
import React, { useState } from "react";
import { FiChevronDown, FiLogOut, FiEdit, FiPlus, FiCalendar } from "react-icons/fi";
import NotificacionesPanel from './NotificacionesPanel';

export default function Header({ userMode, docentePerfil, onLogout, onEditPerfil, onAgregarDocente, onCalendario }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getInitials = () => {
    if (userMode === "admin") {
      return "A";
    }
    if (docentePerfil?.nombre) {
      const names = docentePerfil.nombre.trim().split(" ");
      return names.length > 0 ? (names[0][0] + (names[1]?.[0] || "")).toUpperCase() : "D";
    }
    return "U";
  };

  const avatarColor = userMode === "admin" ? "bg-red-600" : "bg-blue-600";

  return (
    <header className="fixed top-0 left-0 w-full bg-[#4682B4] shadow-md z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold text-white">
          {userMode === "admin" ? "Bienvenido Administrador" : "Bienvenido Docente"}
        </h1>

        <div className="flex items-center gap-3">
          {/* Panel de notificaciones - solo para docentes */}
          {userMode === 'docente' && (
            <NotificacionesPanel docenteId={localStorage.getItem('userId')} />
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                {getInitials()}
              </div>
              <FiChevronDown className="text-white" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
                {userMode === "docente" && (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEditPerfil();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiEdit className="mr-2" /> Editar perfil
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onCalendario();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiCalendar className="mr-2" /> Calendario
                    </button>
                  </>
                )}
                {userMode === "admin" && (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onAgregarDocente();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiPlus className="mr-2" /> Agregar docente
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onCalendario();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiCalendar className="mr-2" /> Calendario
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <FiLogOut className="mr-2" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}