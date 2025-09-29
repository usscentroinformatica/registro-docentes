import React, { useState } from "react";
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { FiChevronLeft, FiChevronRight, FiGift, FiArrowLeft, FiCalendar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const CalendarioView = ({ docentes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const navigate = useNavigate();

  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  const start = startOfWeek(currentMonthStart, { weekStartsOn: 1 });
  const end = endOfWeek(currentMonthEnd, { weekStartsOn: 1 });

  // Obtener cumpleaños de un día
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

  // Calcular edad que cumplirá en el año del calendario mostrado
  const calcularEdadEnAnio = (fechaNacimiento, anioCalendario) => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento + 'T00:00:00');
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

  const handleDayClick = (day, birthdays) => {
    if (birthdays.length > 0) {
      setSelectedDay({ day, birthdays });
    }
  };

  const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20 sm:pt-24 p-4 sm:p-6 pb-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header mejorado */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => navigate("/")} // ✅ CORREGIDO: ahora va a la ruta principal "/"
            className="group flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" size={18} />
            Volver al inicio
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FiCalendar className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Calendario de Cumpleaños
              </h1>
              <p className="text-sm text-gray-600 mt-1">Docentes de la Universidad Señor de Sipán</p>
            </div>
          </div>

          <div className="hidden sm:block w-32" /> {/* Spacer para balance visual */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario principal */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
            {/* Navegación de meses mejorada */}
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
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  {format(currentDate, "yyyy")}
                </p>
              </div>
              
              <button
                onClick={handleNextMonth}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
              >
                <FiChevronRight size={24} />
              </button>
            </div>

            {/* Días de la semana mejorados */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {daysOfWeek.map((dayName) => (
                <div
                  key={dayName}
                  className="text-center font-bold text-gray-600 py-3 text-xs sm:text-sm"
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Celdas del calendario mejoradas */}
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const allDays = [];
                let date = new Date(start);
                while (date <= end) {
                  const currentDay = new Date(date);
                  const isCurrentMonth = currentDay.getMonth() === currentMonthStart.getMonth();
                  const isToday = isSameDay(currentDay, new Date());
                  const birthdays = getBirthdaysForDay(currentDay);
                  const hasBirthday = birthdays.length > 0;
                  const isSelected = selectedDay && isSameDay(selectedDay.day, currentDay);

                  allDays.push(
                    <div
                      key={currentDay.toISOString()}
                      onClick={() => handleDayClick(currentDay, birthdays)}
                      className={`relative p-3 sm:p-4 text-center rounded-xl transition-all duration-300 transform
                        ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                        ${isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                        ${isSelected ? "ring-2 ring-purple-500 ring-offset-2 scale-105" : ""}
                        ${
                          hasBirthday
                            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 border-2 border-amber-200 hover:border-amber-300 shadow-md hover:shadow-lg cursor-pointer"
                            : "border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }
                        min-h-[70px] sm:min-h-[90px] flex flex-col justify-center items-center
                        hover:scale-105`}
                    >
                      <span
                        className={`text-sm sm:text-lg font-bold ${
                          isCurrentMonth ? "text-gray-800" : "text-gray-400"
                        } ${isToday ? "text-blue-600" : ""}`}
                      >
                        {currentDay.getDate()}
                      </span>
                      
                      {hasBirthday && (
                        <>
                          <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-full p-1.5 shadow-lg animate-bounce">
                            <FiGift size={14} />
                          </div>
                          <span className="mt-1 text-xs font-semibold text-orange-600">
                            {birthdays.length} 🎂
                          </span>
                        </>
                      )}
                    </div>
                  );
                  date.setDate(date.getDate() + 1);
                }
                return allDays;
              })()}
            </div>

            {/* Leyenda mejorada */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg shadow-sm"></div>
                <span className="text-gray-700 font-medium">Día con cumpleaños</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 ring-2 ring-blue-500 ring-offset-2 rounded-lg bg-white"></div>
                <span className="text-gray-700 font-medium">Hoy</span>
              </div>
            </div>
          </div>

          {/* Panel lateral de información */}
          <div className="lg:col-span-1 space-y-6">
            {selectedDay ? (
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 animate-fadeIn">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800">
                    {format(selectedDay.day, "d 'de' MMMM", { locale: es })}
                  </h3>
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                    <FiGift className="text-white" size={20} />
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 font-medium">
                  {selectedDay.birthdays.length} {selectedDay.birthdays.length === 1 ? 'cumpleaños' : 'cumpleaños'} este día
                </p>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {selectedDay.birthdays.map((doc) => {
                    const edad = calcularEdadEnAnio(doc.fechaNacimiento, selectedDay.day.getFullYear());
                    return (
                      <div
                        key={doc.id}
                        className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={doc.foto || 'https://via.placeholder.com/64x64?text=Sin+Foto'}
                            alt={doc.nombre}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/64x64?text=Sin+Foto';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm leading-tight">
                              {doc.nombre}
                            </h4>
                            {edad && (
                              <p className="text-xs text-blue-600 font-semibold mt-1">
                                Cumple {edad} años 🎉
                              </p>
                            )}
                            {doc.correoPersonal && (
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                {doc.correoPersonal}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border border-blue-100 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
                  <FiGift className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Selecciona un día
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Haz clic en cualquier día con cumpleaños para ver los detalles de los docentes que celebran
                </p>
              </div>
            )}

            {/* Estadísticas */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-xl p-6 border border-purple-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiCalendar className="text-purple-600" size={20} />
                Estadísticas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Total docentes</span>
                  <span className="text-lg font-bold text-purple-600">{docentes.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Cumpleaños este mes</span>
                  <span className="text-lg font-bold text-purple-600">
                    {docentes.filter(doc => {
                      if (!doc.fechaNacimiento) return false;
                      const nacimiento = parseISO(doc.fechaNacimiento);
                      return nacimiento.getMonth() === currentDate.getMonth();
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarioView;