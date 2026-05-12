import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const analysisBaseUrl =
  import.meta.env.VITE_ANALYZE_API_URL ||
  "https://smart-medical-record-api.onrender.com";

const PublicReport = () => {
  const [searchParams] = useSearchParams();
  const [serverStatus, setServerStatus] = useState("checking");
  const [modelStatus, setModelStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const reportData = useMemo(
    () => ({
      email: searchParams.get("email") || "",
      fileName: searchParams.get("fileName") || "Medical Report",
      fileUrl: searchParams.get("fileUrl") || "",
      mimetype: searchParams.get("mimetype") || "",
    }),
    [searchParams]
  );

  const checkModelStatus = async () => {
    setStatusError(null);
    setServerStatus("checking");

    try {
      const modelRes = await fetch(`${analysisBaseUrl}/model-status`);
      if (!modelRes.ok) {
        throw new Error("Model status endpoint is not responding.");
      }

      const modelData = await modelRes.json();
      setModelStatus(modelData);
      setServerStatus("online");
    } catch (error) {
      setServerStatus("offline");
      const message = (error && error.message) || "";
      const isBlockedByClient =
        message.toLowerCase().includes("failed to fetch") ||
        message.toLowerCase().includes("networkerror");

      setStatusError(
        isBlockedByClient
          ? `Request blocked by browser/extension. Please allowlist ${analysisBaseUrl} and try Refresh Status again.`
          : message || "Could not connect to analysis server."
      );
    }
  };

  useEffect(() => {
    checkModelStatus();
  }, []);

  const handleAnalyzeReport = async () => {
    if (!reportData.fileUrl) {
      setAnalyzeError("No report URL found.");
      return;
    }

    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalysisResult(null);

    try {
      const fileResponse = await fetch(reportData.fileUrl);
      if (!fileResponse.ok) {
        throw new Error("Failed to fetch the report file.");
      }

      const blob = await fileResponse.blob();
      const reportFile = new File([blob], reportData.fileName || "report", {
        type: blob.type || reportData.mimetype || "application/octet-stream",
      });

      const formData = new FormData();
      formData.append("file", reportFile);

      const analyzeResponse = await fetch(`${analysisBaseUrl}/analyze-report`, {
        method: "POST",
        body: formData,
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to analyze report.");
      }

      const result = await analyzeResponse.json();
      setAnalysisResult(result);
    } catch (error) {
      setAnalyzeError(error.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const summary = analysisResult?.summary || {};

  const percent = (value) => {
    const number = Number(value);
    if (Number.isNaN(number)) return "0%";
    return `${Math.round(number * 100)}%`;
  };

  const renderList = (items, emptyText = "No items found.") => {
    const values = Array.isArray(items) && items.length ? items : [emptyText];
    return (
      <ul className="list-disc pl-5 space-y-2 text-gray-700">
        {values.map((item, index) => (
          <li key={`${String(item)}-${index}`}>{item}</li>
        ))}
      </ul>
    );
  };

  const entities = summary.extracted_entities || {};
  const entityEntries = Object.entries(entities).filter(([, value]) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50 to-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="text-teal-700 text-xs font-bold uppercase tracking-wide mb-1">
              Smart Medical Record System
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Medical Report Analyzer
            </h1>
            <p className="mt-2 text-gray-600">
              Patient:{" "}
              <span className="font-semibold text-gray-800">
                {reportData.email || "Unknown"}
              </span>
            </p>
          </div>
          <div
            className={`min-w-[140px] px-4 py-2 rounded-full text-center text-sm font-semibold border ${
              serverStatus === "online"
                ? "bg-green-50 text-teal-800 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {serverStatus === "checking"
              ? "Checking Model"
              : serverStatus === "online"
              ? "Model Ready"
              : "Model Offline"}
          </div>
        </header>

        <section className="bg-white border border-amber-100 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-500">Report</p>
              <p className="font-medium text-gray-800 break-all">
                {reportData.fileName}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={checkModelStatus}
                className="px-4 py-2 bg-amber-100 text-teal-700 rounded-lg hover:bg-amber-200 cursor-pointer font-medium"
              >
                Refresh Status
              </button>
              {reportData.fileUrl ? (
                <a
                  href={reportData.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View
                </a>
              ) : null}
              <button
                onClick={handleAnalyzeReport}
                disabled={!reportData.fileUrl || analyzing || serverStatus !== "online"}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  !reportData.fileUrl || analyzing || serverStatus !== "online"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 cursor-pointer"
                }`}
              >
                {analyzing ? "Analyzing..." : "Analyze Report"}
              </button>
            </div>
          </div>

          {modelStatus && (
            <p className="text-xs text-gray-600 mt-3">
              Classifier: {String(modelStatus.transformer_classifier_active)} |
              NER: {String(modelStatus.medical_ner_active)} | Summary:{" "}
              {String(modelStatus.transformer_summary_active)}
            </p>
          )}
          {statusError && <p className="mt-3 text-sm text-red-600">{statusError}</p>}
          {analyzeError && <p className="mt-3 text-sm text-red-600">{analyzeError}</p>}
        </section>

        {analysisResult && (
          <section className="mt-6 grid gap-5">
            <section className="bg-teal-50 border border-teal-100 rounded-lg shadow-md p-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-center">
              <div>
                <p className="text-teal-700 text-xs font-bold uppercase tracking-wide mb-1">
                  Patient-friendly summary
                </p>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                  {summary.one_line_summary || "Summary not available."}
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2 min-w-[270px]">
                <div className="bg-white border border-teal-100 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-teal-700">
                    {percent(summary.summary_confidence)}
                  </p>
                  <p className="text-xs text-gray-500">Summary</p>
                </div>
                <div className="bg-white border border-teal-100 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-teal-700">
                    {percent(summary.estimated_accuracy)}
                  </p>
                  <p className="text-xs text-gray-500">Accuracy</p>
                </div>
                <div className="bg-white border border-teal-100 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-teal-700">
                    {percent(summary.report_type_confidence)}
                  </p>
                  <p className="text-xs text-gray-500">Type</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Report Details
                </h3>
                <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
                  <dt className="text-gray-500 font-medium">File</dt>
                  <dd className="text-gray-800 break-all">
                    {analysisResult.file_name || reportData.fileName}
                  </dd>
                  <dt className="text-gray-500 font-medium">Content Type</dt>
                  <dd className="text-gray-800">{analysisResult.content_type || "-"}</dd>
                  <dt className="text-gray-500 font-medium">Pages</dt>
                  <dd className="text-gray-800">{analysisResult.page_count ?? "-"}</dd>
                  <dt className="text-gray-500 font-medium">Extraction</dt>
                  <dd className="text-gray-800">{analysisResult.extraction_method || "-"}</dd>
                  <dt className="text-gray-500 font-medium">Engine</dt>
                  <dd className="text-gray-800">{analysisResult.analysis_engine || "-"}</dd>
                  <dt className="text-gray-500 font-medium">Report Type</dt>
                  <dd className="text-gray-800">{summary.report_type || "-"}</dd>
                  <dt className="text-gray-500 font-medium">Report Date</dt>
                  <dd className="text-gray-800">{summary.report_date || "-"}</dd>
                </dl>
              </article>

              <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Confidence Note
                </h3>
                <p className="text-gray-700">
                  {summary.confidence_explanation ||
                    "Confidence explanation not available."}
                </p>
              </article>
            </section>

            <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Patient Summary
              </h3>
              {renderList(summary.patient_friendly_summary)}
            </article>

            <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Key Findings
              </h3>
              <div className="space-y-3">
                {Array.isArray(summary.key_findings) && summary.key_findings.length ? (
                  summary.key_findings.map((finding, index) => (
                    <div
                      key={`${finding.title || "finding"}-${index}`}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {finding.title || "Finding"}
                          </h4>
                          <p className="text-gray-700">{finding.value || "No value"}</p>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                            {finding.interpretation || "unclear"}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-teal-100 text-teal-800">
                            {finding.urgency || "monitor"}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {percent(finding.confidence)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-700 text-sm">
                        {finding.patient_explanation || ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No findings found.</p>
                )}
              </div>
            </article>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Abnormal Results
                </h3>
                {Array.isArray(summary.abnormal_results) &&
                summary.abnormal_results.length ? (
                  <div className="space-y-3">
                    {summary.abnormal_results.map((item, index) => (
                      <div
                        key={`abnormal-${index}`}
                        className="border border-red-100 rounded-lg p-3 bg-red-50"
                      >
                        <p className="font-medium text-red-700">
                          {item.title || "Abnormal finding"}
                        </p>
                        <p className="text-sm text-red-600">{item.value || "-"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No abnormal results detected.</p>
                )}
              </article>

              <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Likely Meaning
                </h3>
                {renderList(summary.likely_meaning)}
              </article>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Next Steps
                </h3>
                {renderList(summary.recommended_next_steps)}
              </article>

              <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Questions For Doctor
                </h3>
                {renderList(summary.questions_for_doctor)}
              </article>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Extracted Entities
                </h3>
                {entityEntries.length ? (
                  <div className="space-y-3">
                    {entityEntries.map(([key, value]) => (
                      <div key={key}>
                        <p className="font-medium text-gray-800 capitalize mb-1">
                          {key.replace(/_/g, " ")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(value) ? value : [value]).map((item, index) => (
                            <span
                              key={`${key}-${index}`}
                              className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                            >
                              {String(item)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No structured entities found.</p>
                )}
              </article>

              <article className="bg-red-50 border border-red-200 rounded-lg shadow-md p-5">
                <h3 className="text-lg font-semibold text-red-700 mb-3">Red Flags</h3>
                {renderList(summary.red_flags)}
              </article>
            </section>

            <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Technical Summary
              </h3>
              <p className="text-gray-700">
                {summary.technical_summary || "Technical summary not available."}
              </p>
            </article>

            <article className="bg-white border border-amber-100 rounded-lg shadow-md p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Extracted Text Preview
              </h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                {analysisResult.extracted_text_preview || "No preview available."}
              </pre>
            </article>

            <article className="bg-amber-50 border border-amber-200 rounded-lg shadow-md p-5">
              <h3 className="text-lg font-semibold text-amber-800 mb-3">Disclaimer</h3>
              <p className="text-amber-900">
                {summary.disclaimer || "Please consult a qualified clinician."}
              </p>
            </article>
          </section>
        )}
      </div>
    </div>
  );
};

export default PublicReport;
