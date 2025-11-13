const Home = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50 to-white w-full">
      {/* Hero Section */}
      <div className="w-full max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
              Smart Medical Record System
            </h1>
            <p className="text-xl text-gray-600">
              Revolutionizing healthcare record management with secure,
              efficient, and accessible digital solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="inline-block px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors duration-150 text-center"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-amber-100 text-teal-700 font-medium rounded-lg hover:bg-amber-200 transition-colors duration-150 text-center"
              >
                Sign In
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            {/* You can add an illustration or image here */}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Why Choose SMRS?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Secure Records",
              description:
                "Your medical data is protected with state-of-the-art encryption and security measures.",
            },
            {
              title: "Easy Access",
              description:
                "Access your medical records anytime, anywhere, from any device securely.",
            },
            {
              title: "Smart Management",
              description:
                "Intelligent organization of medical history, prescriptions, and appointments.",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
