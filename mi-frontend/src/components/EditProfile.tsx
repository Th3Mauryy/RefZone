import React from "react";
import 'react-toastify/dist/ReactToastify.css';
import { useEditProfile } from '../hooks/useEditProfile';
import {
  EditProfileHeader,
  ProfileImageSection,
  ProfileFormFields,
  PasswordSection,
} from './editProfileComponents';
import "../styles/profileForm.css";

export default function EditProfile(): React.ReactElement {
  const {
    form,
    user,
    isLoading,
    isSaving,
    errors,
    previewImage,
    showPasswordSection,
    handleChange,
    handleImageChange,
    handleSubmit,
    togglePasswordSection,
    getDashboardRoute,
  } = useEditProfile();

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tu perfil...</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="edit-profile-container">
      <div className="profile-card">
        <EditProfileHeader
          userName={user.nombre}
          userRole={user.role}
          calificacionPromedio={user.calificacionPromedio}
          totalCalificaciones={user.totalCalificaciones}
          dashboardRoute={getDashboardRoute()}
        />

        <form onSubmit={handleSubmit} className="profile-form">
          <ProfileImageSection
            previewImage={previewImage}
            userName={user.nombre}
            error={errors.imagenPerfil}
            onImageChange={handleImageChange}
          />

          <ProfileFormFields
            form={form}
            errors={errors}
            userRole={user.role}
            onChange={handleChange}
          />

          <PasswordSection
            form={form}
            errors={errors}
            showPasswordSection={showPasswordSection}
            onChange={handleChange}
            onToggle={togglePasswordSection}
          />

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="save-btn"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="btn-spinner"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="btn-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
