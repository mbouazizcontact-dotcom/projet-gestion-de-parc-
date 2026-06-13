import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

const DEFAULT_LOGO = '/src/assets/car.png';

const LogoUploader = ({ onLogoChange, currentLogo, showButtons = true }) => {
  const [logo, setLogo] = useState(currentLogo || localStorage.getItem('customLogo') || DEFAULT_LOGO);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentLogo && currentLogo !== logo) {
      setLogo(currentLogo);
    }
  }, [currentLogo, logo]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetLogo(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetLogo(file);
    }
  };

  const validateAndSetLogo = (file) => {
    // Vérification du format
    if (!file.type.match('image.*')) {
      Swal.fire({
        title: 'Format invalide',
        text: 'Veuillez sélectionner une image (jpg, png, svg)',
        icon: 'error',
        confirmButtonText: 'OK',
        background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
      });
      return;
    }

    // Vérification de la taille
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        title: 'Fichier trop volumineux',
        text: 'La taille du logo ne doit pas dépasser 2MB',
        icon: 'error',
        confirmButtonText: 'OK',
        background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
      });
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const newLogo = e.target.result;
      setLogo(newLogo);
      localStorage.setItem('customLogo', newLogo);
      if (onLogoChange) {
        onLogoChange(newLogo);
      }
      setIsLoading(false);
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Logo mis à jour',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
      });
    };
    reader.readAsDataURL(file);
  };

  const resetLogo = () => {
    Swal.fire({
      title: 'Réinitialiser le logo?',
      text: 'Voulez-vous restaurer le logo par défaut?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
    }).then((result) => {
      if (result.isConfirmed) {
        setLogo(DEFAULT_LOGO);
        localStorage.removeItem('customLogo');
        if (onLogoChange) {
          onLogoChange(DEFAULT_LOGO);
        }
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Logo réinitialisé',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`relative rounded-lg overflow-hidden shadow-sm transition-all duration-200 aspect-square w-full max-w-[160px] ${
          isDragging ? 'shadow-md ring-2 ring-blue-400 scale-[1.02]' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 cursor-pointer">
          <img 
            src={logo} 
            alt="Logo" 
            className={`object-contain w-full h-full transition-all duration-300 ${isDragging ? 'scale-90 opacity-60' : ''} ${isLoading ? 'animate-pulse' : ''}`}
          />
        </div>
        
        {/* Overlay pour le glisser-déposer */}
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-opacity-70 bg-gray-900 backdrop-blur-[1px] transition-opacity ${
            isDragging ? 'opacity-80' : 'opacity-0 hover:opacity-60'
          }`}
        >
          <div className="text-center p-2">
            <ArrowUpTrayIcon className="w-6 h-6 mx-auto mb-1 text-white" />
            <p className="text-xs text-white">
              {isDragging ? 'Déposer ici' : 'Changer le logo'}
            </p>
          </div>
        </div>
        
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
      
      {/* Bouton de réinitialisation masqué pour le ciblage */}
      <button 
        onClick={resetLogo}
        className="hidden reset-logo-btn"
      >
        Réinitialiser
      </button>
    </div>
  );
};

export default LogoUploader; 