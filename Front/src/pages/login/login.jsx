import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../Components/axios/axiosConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [logo, setLogo] = useState("/src/assets/car.png");
  const navigate = useNavigate();

  useEffect(() => {
    const customLogo = localStorage.getItem("customLogo");
    if (customLogo) {
      setLogo(customLogo);
    }
  }, []);

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function (minimum 6 characters)
  const isValidPassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // Exception 1: Empty email
    if (!email.trim()) {
      setError("Veuillez entrer votre email.");
      toast.error("⚠️ Veuillez entrer votre email.", { autoClose: 2500 });
      return;
    }

    // Exception 3: Invalid email
    if (!isValidEmail(email)) {
      setError("Une erreur s'est produite. Veuillez entrer un email valide.");
      toast.error("⚠️ Une erreur s'est produite. Veuillez entrer un email valide.", {
        autoClose: 2500,
      });
      return;
    }

    // Exception 2: Empty password
    if (!password.trim()) {
      setError("Veuillez entrer votre mot de passe.");
      toast.error("⚠️ Veuillez entrer votre mot de passe.", { autoClose: 2500 });
      return;
    }

    // Exception 4: Invalid password
    if (!isValidPassword(password)) {
      setError("Une erreur s'est produite. Veuillez entrer un password valide.");
      toast.error("⚠️ Une erreur s'est produite. Veuillez entrer un password valide.", {
        autoClose: 2500,
      });
      return;
    }

    // Proceed with API call if validations pass
    try {
      const response = await axios.post("/api/users/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("nom", response.data.nom || "Utilisateur");
      toast.success("Connexion réussie", { autoClose: 1500 });
      setTimeout(() => {
        const permissions = response.data.permissions;
        if (permissions?.TableauDeBord?.lire) {
          navigate("/dashboard");
        } else {
          navigate("/unauthorized");
        }
      }, 2100);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setError("Email ou mot de passe incorrect.");
          toast.error("⚠️ Email ou mot de passe incorrect !", {
            autoClose: 2500,
          });
        } else if (error.response.status === 500) {
          setError("Erreur serveur. Veuillez réessayer plus tard.");
          toast.error("Erreur serveur. Veuillez réessayer plus tard.", {
            autoClose: 2500,
          });
        } else {
          setError("Une erreur s'est produite. Veuillez réessayer.");
          toast.error("❌ Une erreur s'est produite. Veuillez réessayer.", {
            autoClose: 2500,
          });
        }
      } else {
        setError("Erreur de connexion. Vérifiez votre connexion internet.");
        toast.error(
          "⚠️ Erreur de connexion. Vérifiez votre connexion internet.",
          { autoClose: 2500 }
        );
      }
    }
  };

  return (
    <>
      <div className="font-sans max-w-7xl mx-auto xl:p-16 h-screen">
        <div className="grid md:grid-cols-2 items-center gap-8 h-full">
          <form
            onSubmit={handleSubmit}
            className="max-w-lg animate-fade-right animate-once mx-auto w-full p-6 relative z-20"
          >
            <div className="mb-12">
              <h3 className="text-gray-800 text-4xl font-extrabold">
                Se connecter
              </h3>
              <p className="text-gray-800 text-sm mt-6">
                Connectez-vous pour accéder au tableau de bord interne.
              </p>
            </div>

            <div className="mb-4">
              <label
                className="text-gray-800 text-[15px] mb-2 block"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative flex items-center">
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-sm text-gray-800 bg-gray-100 focus:bg-transparent px-4 py-3.5 rounded-md outline-blue-600"
                  placeholder="Entrer l'email"
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                className="text-gray-800 text-[15px] mb-2 block"
                htmlFor="password"
              >
                Mot de passe
              </label>
              <div className="relative flex items-center">
                <input
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-sm text-gray-800 bg-gray-100 focus:bg-transparent px-4 py-3.5 rounded-md outline-blue-600"
                  placeholder="Entrer le mot de passe"
                />
                <svg
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#bbb"
                  stroke="#bbb"
                  className="w-[18px] h-[18px] absolute right-4 cursor-pointer"
                  viewBox="0 0 128 128"
                >
                  <path
                    d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z"
                    data-original="#000000"
                  />
                </svg>
              </div>
            </div>

            {error && (
              <div className="mb-4">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm">
                <a
                  href="/ForgotPassword"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full shadow-xl py-3 px-6 text-sm tracking-wide font-semibold rounded-md text-white bg-black hover:bg-gray-700 transition-colors duration-300 focus:outline-none"
              >
                Connexion
              </button>
            </div>
          </form>

          <div className="h-full md:py-6 flex items-center relative max-md:before:hidden before:absolute before:bg-gradient-to-r before:from-[#ffffff] before:via-[#0ab5d8] before:to-[#0e8da7] before:h-full before:w-3/4 before:right-0 before:z-0">
            <img
              src={logo}
              className="rounded-md animate-fade-left animate-once lg:w-[450px] md:w-6/12 z-50 relative"
              alt="Logo de l'entreprise"
              loading="eager"
            />
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export default Login;