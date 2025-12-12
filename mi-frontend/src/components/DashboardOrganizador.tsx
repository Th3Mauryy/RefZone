// @ts-nocheck
import React from "react";
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from './ConfirmModal';
import { useDashboardOrganizador } from '../hooks/useDashboardOrganizador';
import {
  OrganizerHeader,
  OrganizerStats,
  UbicacionesSection,
  OrganizerGamesTable,
  GameModal,
  PostuladosModalComponent,
  ArbitroDetalleModalComponent,
  CalificacionModalComponent,
  UbicacionModalComponent,
  SustitucionModalComponent,
  HistorialModalComponent,
  ReporteModalComponent,
} from './organizerComponents';
import { descargarReportePDF } from '../services/reporteService';

export default function DashboardOrganizador() {
  const {
    // State
    games,
    loading,
    user,
    stats,
    ubicaciones,
    sortedGames,
    pendientesCalificacion,
    
    // Modal States
    modalOpen, setModalOpen,
    modalTitle,
    currentGame, setCurrentGame,
    gameErrors, setGameErrors,
    postuladosModal, setPostuladosModal,
    historialModal, setHistorialModal,
    reporteModal, setReporteModal,
    arbitroDetalleModal, setArbitroDetalleModal,
    sustitucionModal, setSustitucionModal,
    calificacionModal, setCalificacionModal,
    ubicacionModal, setUbicacionModal,
    confirmModal, setConfirmModal,
    
    // User Actions
    logout,
    
    // Game Actions
    openAddModal,
    openEditModal,
    handleSave,
    handleDelete,
    
    // Arbitro Actions
    openPostulados,
    assignArbitro,
    loadHistorialArbitro,
    openSustitucionModal,
    confirmSustitucion,
    confirmDesasignacion,
    
    // Calificacion Actions
    abrirModalCalificacion,
    calificarArbitro,
    
    // Ubicacion Actions
    openUbicacionModal,
    saveUbicacion,
    deleteUbicacion,
    
    // Utilities
    formatDate,
    formatTime,
    haIniciado,
  } = useDashboardOrganizador();

  const handleDownloadPDF = async (mes: number, ano: number) => {
    setReporteModal(prev => ({ ...prev, cargando: true }));
    try {
      await descargarReportePDF(mes, ano, games, user);
      setReporteModal(prev => ({ ...prev, open: false, cargando: false }));
    } catch {
      setReporteModal(prev => ({ ...prev, cargando: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <OrganizerHeader user={user} onLogout={logout} />

      {/* Main Content */}
      <main className="container mx-auto py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">Gestión de Partidos</h2>
              <p className="text-gray-600">Administra los partidos de fútbol 7 y asigna árbitros</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-3">
                <button 
                  onClick={() => setReporteModal(prev => ({ ...prev, open: true }))}
                  className="btn btn-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Historial de Partidos
                </button>
                <button onClick={openAddModal} className="btn btn-primary">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  Agregar Partido
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <OrganizerStats
          stats={stats}
          pendientesCalificacion={pendientesCalificacion}
          onCalificar={abrirModalCalificacion}
        />

        {/* Ubicaciones Section */}
        <UbicacionesSection
          ubicaciones={ubicaciones}
          onAdd={() => openUbicacionModal()}
          onEdit={openUbicacionModal}
          onDelete={deleteUbicacion}
        />

        {/* Games Table */}
        <OrganizerGamesTable
          games={sortedGames}
          loading={loading}
          ubicaciones={ubicaciones}
          onAdd={openAddModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onViewPostulados={openPostulados}
          onSustituir={openSustitucionModal}
          onViewArbitro={(arbitro) => setArbitroDetalleModal({ open: true, arbitro })}
          formatDate={formatDate}
          formatTime={formatTime}
          haIniciado={haIniciado}
        />
      </main>

      {/* MODALS */}
      <GameModal
        open={modalOpen}
        title={modalTitle}
        currentGame={currentGame}
        gameErrors={gameErrors}
        ubicaciones={ubicaciones}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onGameChange={setCurrentGame}
        onErrorChange={setGameErrors}
      />

      <PostuladosModalComponent
        modal={postuladosModal}
        onClose={() => setPostuladosModal({ open: false, postulados: [], gameId: null })}
        onAssign={assignArbitro}
        onViewHistorial={loadHistorialArbitro}
      />

      <HistorialModalComponent
        modal={historialModal}
        onClose={() => setHistorialModal({ open: false, arbitro: null, historial: [], loading: false })}
      />

      <ArbitroDetalleModalComponent
        modal={arbitroDetalleModal}
        onClose={() => setArbitroDetalleModal({ open: false, arbitro: null })}
      />

      <SustitucionModalComponent
        modal={sustitucionModal}
        onClose={() => setSustitucionModal(prev => ({ ...prev, open: false }))}
        onChange={setSustitucionModal}
        onSustituir={confirmSustitucion}
        onDesasignar={confirmDesasignacion}
      />

      <CalificacionModalComponent
        modal={calificacionModal}
        onClose={() => setCalificacionModal({ open: false, partido: null, arbitro: null, estrellas: 0, comentario: '', loading: false })}
        onChange={setCalificacionModal}
        onSubmit={calificarArbitro}
      />

      <UbicacionModalComponent
        modal={ubicacionModal}
        onClose={() => setUbicacionModal(prev => ({ ...prev, open: false }))}
        onChange={setUbicacionModal}
        onSave={saveUbicacion}
      />

      <ReporteModalComponent
        modal={reporteModal}
        onClose={() => setReporteModal(prev => ({ ...prev, open: false }))}
        onChange={setReporteModal}
        onDownload={handleDownloadPDF}
      />

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
        confirmText="Sí, Continuar"
        cancelText="Cancelar"
      />
    </div>
  );
}
