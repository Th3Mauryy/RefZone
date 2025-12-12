import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showWarning } from '../utils/toast';

// ============================================
// TYPES
// ============================================
export interface EditProfileForm {
  email: string;
  contacto: string;
  experiencia: string;
  imagenPerfil: string | null;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserData {
  userId?: string;
  nombre?: string;
  email?: string;
  contacto?: string;
  experiencia?: string;
  imagenPerfil?: string | null;
  role?: 'arbitro' | 'organizador';
  calificacionPromedio?: number;
  totalCalificaciones?: number;
}

export interface FormErrors {
  email?: string;
  contacto?: string;
  experiencia?: string;
  imagenPerfil?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// ============================================
// HOOK
// ============================================
interface UseEditProfileReturn {
  // State
  form: EditProfileForm;
  user: UserData;
  isLoading: boolean;
  isSaving: boolean;
  errors: FormErrors;
  previewImage: string | null;
  showPasswordSection: boolean;
  imageFile: File | null;
  
  // Actions
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  togglePasswordSection: () => void;
  goBack: () => void;
  getDashboardRoute: () => string;
}

export function useEditProfile(): UseEditProfileReturn {
  const navigate = useNavigate();
  
  const [form, setForm] = useState<EditProfileForm>({
    email: "",
    contacto: "",
    experiencia: "",
    imagenPerfil: null,
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [user, setUser] = useState<UserData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState<boolean>(false);

  // ============================================
  // LOAD DATA
  // ============================================
  const loadUserData = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch("/api/usuarios/check-session", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        
        const profileRes = await fetch(`/api/usuarios/perfil/${userData.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(prev => ({
            ...prev,
            ...userData,
            calificacionPromedio: profileData.calificacionPromedio || 0,
            totalCalificaciones: profileData.totalCalificaciones || 0
          }));
          setForm({
            email: profileData.email || "",
            contacto: profileData.contacto || "",
            experiencia: profileData.experiencia || "",
            imagenPerfil: profileData.imagenPerfil || null,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
          setPreviewImage(profileData.imagenPerfil);
        }
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Validaciones en tiempo real
    setErrors(prevErrors => {
      const newErrors: FormErrors = { ...prevErrors };
      delete newErrors[name as keyof FormErrors];
      
      if (name === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors.email = "⚠️ Por favor, ingresa un correo electrónico válido.";
        }
      }
      
      if (name === 'contacto' && value) {
        if (!/^\d+$/.test(value)) {
          newErrors.contacto = "⚠️ Solo se permiten números.";
        } else if (value.length !== 10) {
          newErrors.contacto = "⚠️ Debe contener exactamente 10 dígitos.";
        }
      }
      
      if (name === 'experiencia' && value && value.trim().length < 10) {
        newErrors.experiencia = "⚠️ Describe tu experiencia con al menos 10 caracteres.";
      }
      
      if (name === 'newPassword' && value) {
        if (value.length < 8) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe tener al menos 8 caracteres.";
        } else if (!/[A-Z]/.test(value)) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe incluir al menos una mayúscula.";
        } else if (!/[0-9]/.test(value)) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe incluir al menos un número.";
        }
      }
      
      return newErrors;
    });
  }, []);

  const handleImageChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, imagenPerfil: "Por favor selecciona una imagen válida" }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, imagenPerfil: "La imagen debe ser menor a 5MB" }));
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => setPreviewImage(evt.target?.result as string);
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, imagenPerfil: undefined }));
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const contactRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = "⚠️ Ingresa un email válido";
    }

    if (form.contacto && !contactRegex.test(form.contacto)) {
      newErrors.contacto = "⚠️ El contacto debe contener exactamente 10 dígitos";
    }

    if (form.experiencia && form.experiencia.length < 10) {
      newErrors.experiencia = "⚠️ Describe tu experiencia con al menos 10 caracteres";
    }
    
    // Validación de contraseña
    if (form.currentPassword || form.newPassword || form.confirmPassword) {
      if (!form.currentPassword) {
        newErrors.currentPassword = "⚠️ Debes ingresar tu contraseña actual";
      }
      
      if (!form.newPassword) {
        newErrors.newPassword = "⚠️ Debes ingresar una nueva contraseña";
      } else {
        if (form.newPassword.length < 8) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe tener al menos 8 caracteres";
        } else if (!/[A-Z]/.test(form.newPassword)) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe incluir al menos una mayúscula";
        } else if (!/[0-9]/.test(form.newPassword)) {
          newErrors.newPassword = "⚠️ Contraseña débil: debe incluir al menos un número";
        }
      }
      
      if (!form.confirmPassword) {
        newErrors.confirmPassword = "⚠️ Debes confirmar tu nueva contraseña";
      } else if (form.newPassword !== form.confirmPassword) {
        newErrors.confirmPassword = "⚠️ Las contraseñas no coinciden";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Verificar si hay cambios
    const hasChanges = 
      imageFile !== null ||
      form.email !== user.email ||
      form.contacto !== user.contacto ||
      form.experiencia !== user.experiencia ||
      form.currentPassword !== "" ||
      form.newPassword !== "";

    if (!hasChanges) {
      showWarning("No hay cambios para guardar");
      return;
    }

    setIsSaving(true);
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      if (form.email && form.email !== user.email) formData.append("email", form.email);
      if (form.contacto && form.contacto !== user.contacto) formData.append("contacto", form.contacto);
      if (form.experiencia && form.experiencia !== user.experiencia) formData.append("experiencia", form.experiencia);
      if (imageFile) formData.append("imagenPerfil", imageFile);
      if (form.currentPassword && form.newPassword) {
        formData.append("currentPassword", form.currentPassword);
        formData.append("newPassword", form.newPassword);
      }

      const res = await fetch("/api/usuarios/editar-perfil", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess(data.message || "¡Perfil actualizado exitosamente!");
        
        // Limpiar campos de contraseña
        setForm(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
        setShowPasswordSection(false);
        
        // Recargar datos
        await loadUserData();
      } else {
        showError(data.message || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      showError("Hubo un problema al actualizar tu perfil");
    } finally {
      setIsSaving(false);
    }
  }, [form, user, imageFile, validateForm, loadUserData]);

  const togglePasswordSection = useCallback((): void => {
    setShowPasswordSection(prev => !prev);
    if (showPasswordSection) {
      setForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      setErrors(prev => ({
        ...prev,
        currentPassword: undefined,
        newPassword: undefined,
        confirmPassword: undefined
      }));
    }
  }, [showPasswordSection]);

  const getDashboardRoute = useCallback((): string => {
    return user.role === 'organizador' ? '/dashboard-organizador' : '/dashboard';
  }, [user.role]);

  const goBack = useCallback((): void => {
    navigate(getDashboardRoute());
  }, [navigate, getDashboardRoute]);

  return {
    form,
    user,
    isLoading,
    isSaving,
    errors,
    previewImage,
    showPasswordSection,
    imageFile,
    handleChange,
    handleImageChange,
    handleSubmit,
    togglePasswordSection,
    goBack,
    getDashboardRoute,
  };
}
