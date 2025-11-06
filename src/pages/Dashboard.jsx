import { useEffect, useState } from "react";
import { auth, db } from "../Firebase";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [summaries, setSummaries] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);
  const navigate = useNavigate();

  // Fetch medical reports from Firestore
  const fetchReports = async (userId) => {
    if (!userId) return;

    setLoadingReports(true);
    try {
      // Query for user's reports with completed status
      const q = query(
        collection(db, "medicalReports"),
        where("userId", "==", userId),
        where("status", "==", "completed")
      );

      const querySnapshot = await getDocs(q);
      const reportsData = [];
      querySnapshot.forEach((doc) => {
        reportsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by uploadDate in descending order (newest first)
      reportsData.sort((a, b) => {
        const dateA = a.uploadDate?.toDate
          ? a.uploadDate.toDate()
          : new Date(a.uploadedAt || 0);
        const dateB = b.uploadDate?.toDate
          ? b.uploadDate.toDate()
          : new Date(b.uploadedAt || 0);
        return dateB - dateA;
      });

      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        fetchReports(user.uid);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null);
      setUploadSuccess(false);
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (fileToUpload) => {
    if (!user) {
      setUploadError("No user logged in.");
      return;
    }
    if (!fileToUpload) {
      setUploadError("No file selected.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);

    let tempId = null;
    let docRef = null;

    try {
      // Step 1: Upload file to backend (saves to temp location)
      const formData = new FormData();
      formData.append("pdf", fileToUpload);
      formData.append("userId", user.uid);

      const uploadResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || "File upload failed on backend.");
      }

      const uploadResult = await uploadResponse.json();
      tempId = uploadResult.data.tempId;

      // Step 2: Save metadata to Firestore FIRST
      // We'll use tempId temporarily, then update with final paths after confirmation
      docRef = await addDoc(collection(db, "medicalReports"), {
        userId: user.uid,
        fileName: uploadResult.data.originalName || fileToUpload.name,
        tempId: tempId, // Temporary ID until confirmation
        mimetype: uploadResult.data.mimetype || fileToUpload.type,
        size: uploadResult.data.size || fileToUpload.size,
        status: "pending", // Mark as pending until file is confirmed
        uploadDate: serverTimestamp(),
      });

      // Step 3: If Firebase save succeeded, confirm the file save on backend
      const confirmResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/upload/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tempId: tempId }),
        }
      );

      if (!confirmResponse.ok) {
        // If confirmation fails, delete the Firestore document and cancel the temp file
        await deleteDoc(docRef);
        await fetch(`${import.meta.env.VITE_API_URL}/upload/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tempId: tempId }),
        });
        throw new Error("Failed to confirm file save on backend.");
      }

      const confirmResult = await confirmResponse.json();
      const fileData = confirmResult.data;

      // Step 4: Update Firestore document with final file paths
      await updateDoc(docRef, {
        uploadedFileName: fileData.name,
        filePath: fileData.filePath,
        fileUrl: fileData.url,
        uploadedAt: fileData.uploadedAt,
        status: "completed",
        tempId: null, // Remove tempId now that we have final paths
      });

      setUploading(false);
      setUploadSuccess(true);
      setFile(null);
      console.log("File uploaded and metadata saved:", fileData.url);

      // Refresh reports list after successful upload
      await fetchReports(user.uid);
    } catch (error) {
      setUploading(false);
      setUploadError(`Upload failed: ${error.message}`);
      console.error("Upload error:", error);

      // Cleanup: If we created a Firestore document but something failed after, delete it
      if (docRef) {
        try {
          await deleteDoc(docRef);
        } catch (deleteError) {
          console.error("Failed to delete Firestore document:", deleteError);
        }
      }

      // Cleanup: If we have a temp file, cancel it
      if (tempId) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/upload/cancel`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tempId: tempId }),
          });
        } catch (cancelError) {
          console.error("Failed to cancel temp file:", cancelError);
        }
      }
    }
  };

  // Delete report function
  const handleDeleteReport = async (report) => {
    if (
      !window.confirm(`Are you sure you want to delete "${report.fileName}"?`)
    ) {
      return;
    }

    try {
      // Step 1: Delete from Firebase first
      await deleteDoc(doc(collection(db, "medicalReports"), report.id));

      // Step 2: Delete file from backend
      if (report.uploadedFileName) {
        const deleteResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/files/${report.userId}/${
            report.uploadedFileName
          }`,
          {
            method: "DELETE",
          }
        );

        if (!deleteResponse.ok) {
          console.error("Failed to delete file from backend");
          // Note: Firestore doc is already deleted, so we continue
        }
      }

      // Refresh reports list
      await fetchReports(user.uid);
    } catch (error) {
      console.error("Error deleting report:", error);
      alert(`Failed to delete report: ${error.message}`);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Analyze all medical reports
  const handleAnalyze = async () => {
    if (!user) {
      setAnalyzeError("Please log in to analyze reports.");
      return;
    }

    if (reports.length === 0) {
      setAnalyzeError(
        "No medical reports available to analyze. Please upload some reports first."
      );
      return;
    }

    setAnalyzing(true);
    setAnalyzeError(null);
    setSummaries(null);

    try {
      // Prepare file paths and mime types
      const filePaths = reports.map((report) => report.filePath);
      const mimeTypes = reports.map((report) => report.mimetype);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          filePaths: filePaths,
          mimeTypes: mimeTypes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Analysis failed.");
      }

      const result = await response.json();
      setSummaries(result.data);
    } catch (error) {
      console.error("Analyze error:", error);
      setAnalyzeError(`Analysis failed: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Medical Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          <button
            className="cursor-pointer ml-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-150"
            onClick={() => document.getElementById("fileInput").click()}
          >
            Add New Record
          </button>
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }}
            accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp"
            onChange={handleFileChange}
          />
        </div>
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
            <div
              className="bg-teal-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        {uploadError && (
          <p className="text-red-500 text-sm mt-2">{uploadError}</p>
        )}
        {uploadSuccess && (
          <p className="text-green-500 text-sm mt-2">
            File uploaded successfully!
          </p>
        )}
      </div>

      {/* Analyze Button */}
      {reports.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                AI-Powered Analysis
              </h2>
              <p className="text-gray-600 text-sm">
                Get intelligent summaries of all your medical reports using AI
              </p>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || reports.length === 0}
              className={`px-6 py-3 cursor-pointer rounded-lg font-medium transition-colors duration-150 ml-2 ${
                analyzing || reports.length === 0
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Analyzing...
                </span>
              ) : (
                "🔍 Analyze Reports"
              )}
            </button>
          </div>
          {analyzeError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{analyzeError}</p>
            </div>
          )}
        </div>
      )}

      {/* Summaries Display */}
      {summaries && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Patient Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👤</span>
              <h2 className="text-xl font-semibold text-gray-800">
                Patient Summary
              </h2>
            </div>
            <div className="prose max-w-none">
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {summaries.patient_summary}
              </div>
            </div>
          </div>

          {/* Doctor Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🩺</span>
              <h2 className="text-xl font-semibold text-gray-800">
                Doctor Summary
              </h2>
            </div>
            <div className="prose max-w-none">
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {summaries.doctor_summary}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Reports List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Your Medical Reports
        </h2>

        {loadingReports ? (
          <div className="text-center py-8 text-gray-500">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No medical reports yet. Upload your first report using the "Add New
            Record" button above.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col sm:flex-row justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📄</div>
                    <div className="min-w-0 overflow-hidden flex-auto">
                      <h3 className="font-medium truncate text-gray-800">
                        {report.fileName}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{formatFileSize(report.size)}</span>
                        <span>•</span>
                        <span>
                          {formatDate(report.uploadDate || report.uploadedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {report.fileUrl && (
                    <a
                      href={report.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 ml-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteReport(report)}
                    className="px-3 py-1.5 bg-red-600 cursor-pointer text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
