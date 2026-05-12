import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./Firebase";
import { Toaster } from "react-hot-toast";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PublicReport from "./pages/PublicReport";

const AppLayout = () => {
  const location = useLocation();
  const isPublicReportPage = location.pathname === "/public-report";

  return (
    <div className="min-h-screen flex flex-col w-full">
      {!isPublicReportPage && <Header />}
      <main className="grow w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/public-report" element={<PublicReport />} />
        </Routes>
      </main>
      {!isPublicReportPage && <Footer />}
    </div>
  );
};

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <AppLayout />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            border: "1px solid #fcd34d",
            padding: "12px 14px",
            color: "#0f172a",
            background: "#fffdf6",
          },
          success: {
            style: {
              border: "1px solid #99f6e4",
              background: "#f0fdfa",
            },
          },
          error: {
            style: {
              border: "1px solid #fecaca",
              background: "#fef2f2",
            },
          },
        }}
      />
    </Router>
  );
};

export default App;
