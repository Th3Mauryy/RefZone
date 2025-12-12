import React, { ChangeEvent } from 'react';
import { FormErrors, EditProfileForm } from '../../hooks/useEditProfile';

interface ProfileFormFieldsProps {
  form: EditProfileForm;
  errors: FormErrors;
  userRole?: 'arbitro' | 'organizador';
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  form,
  errors,
  userRole,
  onChange,
}) => {
  return (
    <div className="form-fields-section">
      {/* Email */}
      <div className="form-group">
        <label htmlFor="email">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="field-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          Correo Electrónico
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="tu@email.com"
          className={errors.email ? "input-error" : ""}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      {/* Contacto */}
      <div className="form-group">
        <label htmlFor="contacto">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="field-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
          </svg>
          Número de Contacto
        </label>
        <input
          type="tel"
          id="contacto"
          name="contacto"
          value={form.contacto}
          onChange={onChange}
          placeholder="10 dígitos"
          maxLength={10}
          className={errors.contacto ? "input-error" : ""}
        />
        {errors.contacto && <span className="field-error">{errors.contacto}</span>}
      </div>

      {/* Experiencia - Solo para árbitros */}
      {userRole === 'arbitro' && (
        <div className="form-group">
          <label htmlFor="experiencia">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="field-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
            </svg>
            Experiencia
          </label>
          <textarea
            id="experiencia"
            name="experiencia"
            value={form.experiencia}
            onChange={onChange}
            placeholder="Describe tu experiencia como árbitro..."
            rows={4}
            className={errors.experiencia ? "input-error" : ""}
          />
          {errors.experiencia && <span className="field-error">{errors.experiencia}</span>}
        </div>
      )}
    </div>
  );
};
