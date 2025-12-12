import React, { ChangeEvent } from 'react';
import { FormErrors, EditProfileForm } from '../../hooks/useEditProfile';

interface PasswordSectionProps {
  form: EditProfileForm;
  errors: FormErrors;
  showPasswordSection: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
}

export const PasswordSection: React.FC<PasswordSectionProps> = ({
  form,
  errors,
  showPasswordSection,
  onChange,
  onToggle,
}) => {
  return (
    <div className="password-section">
      <button
        type="button"
        className="toggle-password-btn"
        onClick={onToggle}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="toggle-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        {showPasswordSection ? "Cancelar cambio de contraseña" : "Cambiar contraseña"}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className={`chevron-icon ${showPasswordSection ? 'rotated' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {showPasswordSection && (
        <div className="password-fields">
          {/* Contraseña actual */}
          <div className="form-group">
            <label htmlFor="currentPassword">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="field-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
              Contraseña Actual
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={form.currentPassword}
              onChange={onChange}
              placeholder="Ingresa tu contraseña actual"
              className={errors.currentPassword ? "input-error" : ""}
            />
            {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
          </div>

          {/* Nueva contraseña */}
          <div className="form-group">
            <label htmlFor="newPassword">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="field-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={form.newPassword}
              onChange={onChange}
              placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
              className={errors.newPassword ? "input-error" : ""}
            />
            {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
          </div>

          {/* Confirmar contraseña */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="field-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              placeholder="Repite la nueva contraseña"
              className={errors.confirmPassword ? "input-error" : ""}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>
        </div>
      )}
    </div>
  );
};
