import { Link } from "react-router-dom";
import { auth } from "../Firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("You have been successfully logged out!");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-linear-to-r from-amber-50 to-amber-100 shadow-md">
      <nav className="container mx-auto flex flex-wrap justify-between items-center py-4 px-6">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-teal-700 text-2xl font-bold tracking-tight">
            SMRS
          </span>
          <span className="hidden md:inline text-gray-600 text-sm">
            Smart Medical Record System
          </span>
        </Link>
        <div className="flex items-center space-x-1 sm:space-x-4">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="px-4 py-2 text-sm font-medium text-teal-700 hover:text-teal-800 hover:bg-amber-200 rounded-lg transition-colors duration-150 ease-in-out"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150 ease-in-out"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-teal-700 hover:text-teal-800 hover:bg-amber-200 rounded-lg transition-colors duration-150 ease-in-out"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors duration-150 ease-in-out"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
