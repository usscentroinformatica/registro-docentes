// src/components/CalendarioView.jsx
import React, { useState, useEffect } from "react";
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { FiChevronLeft, FiChevronRight, FiGift, FiArrowLeft, FiCalendar, FiUser, FiEdit2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import EventoForm from "./EventoForm";
import ModalEditarEvento from "./ModalEditarEvento";


const CalendarioView = ({ docentes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventoToEdit, setEventoToEdit] = useState(null);
  const navigate = useNavigate();
  const userMode = localStorage.getItem('userMode');

  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  const start = startOfWeek(currentMonthStart, { weekStartsOn: 1 });
  const end = endOfWeek(currentMonthEnd, { weekStartsOn: 1 });

  // Escuchar eventos desde Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "eventos"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEventos(data);
    });
    return () => unsub();
  }, []);

  const getBirthdaysForDay = (dia) => {
    return docentes.filter((doc) => {
      if (!doc.fechaNacimiento) return false;
      const nacimiento = parseISO(doc.fechaNacimiento);
      return (
        nacimiento.getDate() === dia.getDate() &&
        nacimiento.getMonth() === dia.getMonth()
      );
    });
  };

  const getEventosForDay = (dia) => {
    return eventos.filter((ev) => {
      if (!ev.fecha) return false;
      const fecha = parseISO(ev.fecha);
      return (
        fecha.getDate() === dia.getDate() &&
        fecha.getMonth() === dia.getMonth() &&
        fecha.getFullYear() === dia.getFullYear()
      );
    });
  };

  const calcularEdadEnAnio = (fechaNacimiento, anioCalendario) => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento + "T00:00:00");
    const edad = anioCalendario - nacimiento.getFullYear();
    return edad > 0 ? edad : null;
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDay(null);
  };

  const handleDayClick = (day, birthdays, eventosDia) => {
    if (birthdays.length > 0 || eventosDia.length > 0) {
      setSelectedDay({ day, birthdays, eventos: eventosDia });
    }
  };

  // Obtener nombres de docentes etiquetados
  const getDocentesEtiquetados = (docentesIds) => {
    if (!docentesIds || docentesIds.length === 0) return [];
    return docentes.filter(doc => docentesIds.includes(doc.id));
  };

  const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20 sm:pt-24 p-4 sm:p-6 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/")}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" size={18} />
              Volver al inicio
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FiCalendar className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Calendario
              </h1>
              <p className="text-sm text-gray-600 mt-1">Eventos programados y cumpleaños</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario principal */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
            {/* Navegación meses */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
              <button
                onClick={handlePrevMonth}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
              >
                <FiChevronLeft size={24} />
              </button>

              <div className="text-center">
                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent capitalize">
                  {format(currentDate, "MMMM", { locale: es })}
                </h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">{format(currentDate, "yyyy")}</p>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
              >
                <FiChevronRight size={24} />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {daysOfWeek.map((dayName) => (
                <div key={dayName} className="text-center font-bold text-gray-600 py-3 text-xs sm:text-sm">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Celdas del calendario */}
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const allDays = [];
                let date = new Date(start);
                while (date <= end) {
                  const currentDay = new Date(date);
                  const isCurrentMonth = currentDay.getMonth() === currentMonthStart.getMonth();
                  const isToday = isSameDay(currentDay, new Date());
                  const birthdays = getBirthdaysForDay(currentDay);
                  const eventosDia = getEventosForDay(currentDay);
                  const hasBirthday = birthdays.length > 0;
                  const hasEventos = eventosDia.length > 0;
                  const isSelected = selectedDay && isSameDay(selectedDay.day, currentDay);

                  allDays.push(
                    <div
                      key={currentDay.toISOString()}
                      onClick={() => handleDayClick(currentDay, birthdays, eventosDia)}
                      className={`relative p-2 sm:p-3 text-center rounded-xl transition-all duration-300 transform cursor-pointer
                        ${isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50"}
                        ${isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                        ${isSelected ? "ring-2 ring-purple-500 ring-offset-2 scale-105" : ""}
                        ${(hasBirthday || hasEventos) ? "hover:shadow-lg" : ""}
                        min-h-[90px] flex flex-col items-start`}
                    >
                      <span
                        className={`text-sm sm:text-lg font-bold ${isCurrentMonth ? "text-gray-800" : "text-gray-400"} ${isToday ? "text-blue-600" : ""}`}
                      >
                        {currentDay.getDate()}
                      </span>

                      {/* Cumpleaños */}
                      {hasBirthday && (
                        <div className="mt-1 bg-amber-200 text-amber-800 text-[10px] px-1 rounded-md shadow-sm flex items-center justify-center">
                          🎂 {birthdays.length} cumple
                        </div>
                      )}

                      {/* Eventos */}
                      {hasEventos && eventosDia.map((ev, i) => (
                        <div
                          key={i}
                          className="mt-1 bg-blue-100 text-blue-800 text-[10px] px-1 rounded-md shadow-sm truncate w-full"
                          title={ev.titulo}
                        >
                          {ev.titulo.length > 12 ? ev.titulo.slice(0, 12) + "…" : ev.titulo}
                        </div>
                      ))}
                    </div>
                  );
                  date.setDate(date.getDate() + 1);
                }
                return allDays;
              })()}
            </div>
          </div>

          {/* Panel lateral */}
          <div className="lg:col-span-1 space-y-6">
            {userMode === 'admin' && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                >
                  <FiCalendar size={20} />
                  Agregar Evento
                </button>
              </div>
            )}

            {selectedDay ? (
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 animate-fadeIn">
                <h3 className="text-xl font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                  {format(selectedDay.day, "d 'de' MMMM", { locale: es })}
                </h3>

                {/* Cumpleaños */}
                {selectedDay.birthdays.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FiGift className="text-amber-500" /> Cumpleaños
                    </h4>
                    {selectedDay.birthdays.map((doc) => {
                      const edad = calcularEdadEnAnio(doc.fechaNacimiento, selectedDay.day.getFullYear());
                      const fotoSrc = doc.foto || 'https://via.placeholder.com/40?text=Sin+Foto';
                      return (
                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 mb-2 hover:bg-amber-100 transition-colors">
                          <img
                            src={fotoSrc}
                            alt={doc.nombre}
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-300 shadow-sm"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=Sin+Foto'; }}
                          />
                          <div className="flex-1">
                            <p className="font-bold text-gray-800">{doc.nombre}</p>
                            {edad && <p className="text-xs text-amber-600">Cumple {edad} años</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Eventos */}
                {selectedDay.eventos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FiCalendar className="text-blue-500" /> Eventos
                    </h4>
                    {selectedDay.eventos.map((ev) => {
                      const docentesEtiquetados = getDocentesEtiquetados(ev.docentesEtiquetados || []);
                      return (
                        <div key={ev.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-3 hover:bg-blue-100 transition-colors relative">
                          {userMode === 'admin' && (
                            <button
                              onClick={() => {
                                setEventoToEdit(ev);
                                setShowEditModal(true);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-white rounded-full hover:bg-blue-100 text-blue-600 transition-colors shadow-sm"
                              title="Editar evento"
                            >
                              <FiEdit2 size={14} />
                            </button>
                          )}
                          <div className="flex items-start gap-3 mb-2">
                            <FiCalendar className="mt-1 text-blue-500 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 mb-1">{ev.titulo}</p>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium bg-blue-100 px-2 py-0.5 rounded-md">
                                  {ev.hora ? `${ev.hora}` : "Sin hora definida"}
                                </span>
                              </div>
                              {ev.descripcion && (
                                <p className="text-xs text-gray-600 leading-relaxed">{ev.descripcion}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Docentes etiquetados */}
                          {docentesEtiquetados.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <FiUser size={14} className="text-blue-600" />
                                <p className="text-xs font-semibold text-blue-700">
                                  Docentes asignados:
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {docentesEtiquetados.map(doc => (
                                  <div 
                                    key={doc.id}
                                    className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-blue-200 shadow-sm"
                                  >
                                    <img
                                      src={doc.foto || 'https://via.placeholder.com/24?text=?'}
                                      alt={doc.nombre}
                                      className="w-5 h-5 rounded-full object-cover"
                                      onError={(e) => { e.target.src = 'https://via.placeholder.com/24?text=?'; }}
                                    />
                                    <span className="text-xs font-medium text-gray-700">
                                      {doc.nombre.split(' ')[0]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border border-blue-100 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="text-blue-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Selecciona un día
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Haz clic en cualquier día con cumpleaños o eventos para ver los detalles completos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para agregar evento - solo para admins */}
        {showModal && userMode === 'admin' && (
          <EventoForm onClose={() => setShowModal(false)} docentes={docentes} />
        )}

        {/* Modal para editar evento - solo para admins */}
        {showEditModal && eventoToEdit && userMode === 'admin' && (
          <ModalEditarEvento 
            onClose={() => {
              setShowEditModal(false);
              setEventoToEdit(null);
            }} 
            evento={eventoToEdit} 
            docentes={docentes} 
          />
        )}
      </div>
    </div>
  );
};

export default CalendarioView;