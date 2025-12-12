import React, { useState } from "react";
import 'react-toastify/dist/ReactToastify.css';
import { useDashboard } from '../hooks/useDashboard';
import { ApplyModalState, CancelModalState } from '../types';
import {
  DashboardHeader,
  DashboardSidebar,
  GamesTable,
  ApplyModal,
  CancelModal
} from './dashboardComponents';

export default function Dashboard(): React.ReactElement {
  // Hook personalizado con toda la lógica
  const {
    games,
    user,
    loading,
    canchas,
    ubicaciones,
    canchaSeleccionada,
    applyingGames,
    loadGames,
    handleCanchaChange,
    handleApply,
    handleCancelPostulation,
    logout,
    formatDate,
    formatTime,
    getButtonState,
  } = useDashboard();

  // Estado de modales (local al componente)
  const [applyModal, setApplyModal] = useState<ApplyModalState>({ open: false, gameId: null });
  const [cancelModal, setCancelModal] = useState<CancelModalState>({ open: false, gameId: null });

  // Handlers de modales
  const openApplyModal = (gameId: string): void => {
    setApplyModal({ open: true, gameId });
  };

  const closeApplyModal = (): void => {
    setApplyModal({ open: false, gameId: null });
  };

  const confirmApply = async (): Promise<void> => {
    if (applyModal.gameId) {
      await handleApply(applyModal.gameId);
      closeApplyModal();
    }
  };

  const openCancelModal = (gameId: string): void => {
    setCancelModal({ open: true, gameId });
  };

  const closeCancelModal = (): void => {
    setCancelModal({ open: false, gameId: null });
  };

  const confirmCancel = async (): Promise<void> => {
    if (cancelModal.gameId) {
      await handleCancelPostulation(cancelModal.gameId, user.userId);
      closeCancelModal();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <DashboardHeader user={user} onLogout={logout} />

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Games Table - 3 columns */}
          <div className="lg:col-span-3">
            <GamesTable
              games={games}
              canchas={canchas}
              ubicaciones={ubicaciones}
              canchaSeleccionada={canchaSeleccionada}
              loading={loading}
              applyingGames={applyingGames}
              onCanchaChange={handleCanchaChange}
              onRefresh={() => loadGames(canchaSeleccionada)}
              onApply={openApplyModal}
              onCancelPostulation={openCancelModal}
              formatDate={formatDate}
              formatTime={formatTime}
              getButtonState={getButtonState}
            />
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <DashboardSidebar />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ApplyModal
        open={applyModal.open}
        loading={applyModal.gameId ? applyingGames.has(applyModal.gameId) : false}
        onConfirm={confirmApply}
        onCancel={closeApplyModal}
      />

      <CancelModal
        open={cancelModal.open}
        onConfirm={confirmCancel}
        onCancel={closeCancelModal}
      />
    </div>
  );
}
