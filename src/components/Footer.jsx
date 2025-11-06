const Footer = () => {
  return (
    <footer className="bg-linear-to-r from-amber-50 to-amber-100 shadow-md mt-auto border-t border-amber-200">
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-600 text-sm">
            <p>
              &copy; {new Date().getFullYear()} Smart Medical Record System. All
              rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-teal-600 hover:text-teal-700 text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-teal-600 hover:text-teal-700 text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-teal-600 hover:text-teal-700 text-sm">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
