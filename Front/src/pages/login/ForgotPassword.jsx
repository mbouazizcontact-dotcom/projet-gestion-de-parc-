import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../Components/axios/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!email) {
      toast.error('Veuillez saisir votre adresse email');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/users/forgot-password', { email });
      setEmailSent(true);
      toast.success(response.data.message || 'Email de réinitialisation envoyé avec succès');
      
    } catch (error) {
      console.error('Erreur:', error);
      let errorMessage = 'Une erreur s\'est produite. Veuillez réessayer.';
      
      // if (error.response) {
      //   if (error.response.status === 404) {
      //     errorMessage = 'Aucun compte associé à cette adresse email.';
      //   } else if (error.response.data && error.response.data.message) {
      //     errorMessage = error.response.data.message;
      //   }
      // }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="font-sans max-w-7xl mx-auto xl:p-16 h-screen">
        <div className="grid md:grid-cols-1 items-center gap-8 h-full">
          <div className="max-w-lg animate-fade-right animate-once mx-auto w-full p-6 relative z-20">
            <div className="mb-12 text-center">
              <h3 className="text-gray-800 text-4xl font-extrabold">Mot de passe oublié</h3>
              {!emailSent ? (
                <p className="text-gray-800 text-sm mt-6">
                  Veuillez saisir votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
                </p>
              ) : (
                <p className="text-green-600 text-sm mt-6">
                  Si l'email est associé à un compte, un lien de réinitialisation a été envoyé.
                  Veuillez vérifier votre boîte de réception et vos spams.
                </p>
              )}
            </div>

            {!emailSent ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="text-gray-800 text-[15px] mb-2 block" htmlFor="email">Email</label>
                  <div className="relative flex items-center">
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full text-sm text-gray-800 bg-gray-100 focus:bg-transparent px-4 py-3.5 rounded-md outline-blue-600"
                      placeholder="Entrez votre email"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full shadow-xl py-3 px-6 text-sm tracking-wide font-semibold rounded-md text-white bg-black hover:bg-gray-700 transition-colors duration-300 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6">
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full shadow-xl py-3 px-6 text-sm tracking-wide font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300 focus:outline-none"
                >
                  Envoyer à une autre adresse
                </button>
              </div>
            )}

            <div className="text-center">
              <Link 
                to="/" 
                className="text-blue-600 font-semibold hover:underline"
              >
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export default ForgotPassword; 