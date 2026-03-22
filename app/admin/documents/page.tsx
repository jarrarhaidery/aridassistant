"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function DocumentsPage() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("");
      setMessageType("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      setMessageType("error");
      return;
    }

    // Check file type
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Only PDF, DOCX, and TXT files are allowed");
      setMessageType("error");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage("File size must be less than 10MB");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("");

    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/admin/upload-document`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || "Document uploaded and processed successfully");
        setMessageType("success");
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const error = await response.json();
        setMessage(error.detail || "Upload failed");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed. Please try again.");
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Document Management
        </h1>
        <p className="text-sm text-gray-600">
          Upload documents to expand the knowledge base
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-white border border-gray-200 p-8 max-w-2xl">
        <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-6">
          Upload New Document
        </h2>

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File (PDF, DOCX, or TXT)
          </label>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 bg-white focus:outline-none focus:border-gray-900 p-3"
          />
          {file && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Selected:</span> {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Size: {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            "Upload & Process Document"
          )}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-4 border ${
              messageType === "success"
                ? "bg-gray-50 border-gray-900 text-gray-900"
                : "bg-red-50 border-red-600 text-red-900"
            }`}
          >
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wider">
            Instructions
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>Supported formats: PDF, DOCX, TXT</li>
            <li>Maximum file size: 10MB</li>
            <li>Document will be processed and added to knowledge base</li>
            <li>Processing may take 10-30 seconds depending on file size</li>
          </ul>
        </div>
      </div>

      {/* Stats Card */}
      <div className="mt-8 bg-white border border-gray-200 p-6 max-w-2xl">
        <h3 className="font-medium text-gray-900 mb-2">Knowledge Base Status</h3>
        <p className="text-sm text-gray-600">
          Documents are automatically chunked, embedded, and indexed for retrieval
        </p>
      </div>
    </div>
  );
}