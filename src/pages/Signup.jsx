import { useState } from "react";
import { auth } from "../Firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account created successfully! Please login to continue.");
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError(
          "This email is already registered. Please use a different email."
        );
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError("Error creating account. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
        {/* Left side - Features */}
        <div className="hidden md:block w-1/2 pr-12">
          <div className="bg-linear-to-br from-teal-100 to-amber-50 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Join SMRS Today
            </h2>
            <ul className="space-y-4">
              {[
                "Secure storage of your medical records",
                "Easy sharing with healthcare providers",
                "Real-time health data tracking",
                "24/7 access to your medical history",
              ].map((feature, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <span className="mr-2">✓</span> {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right side - Signup Form */}
        <div className="w-full md:w-1/2 max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-gray-900">Create Account</h1>
            <p className="mt-3 text-lg text-gray-600">
              Start managing your medical records
            </p>
          </div>
          <div className="mt-8 bg-white p-8 rounded-xl shadow-sm border border-amber-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-amber-200 rounded-lg 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                             transition duration-150 ease-in-out"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-amber-200 rounded-lg 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                             transition duration-150 ease-in-out"
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                           text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-teal-500 transition duration-150 ease-in-out
                           text-sm font-semibold cursor-pointer"
                >
                  Create Account
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-teal-600 hover:text-teal-700"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
