import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificatesAPI } from '../services/api';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import Card from '../components/Card';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setResult(null);
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setResult(null);

    try {
      console.log('Starting upload for file:', file.name);
      const response = await certificatesAPI.upload(file, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      console.log('Upload response:', response);
      setResult(response);
      
      if (response.verified) {
        toast.success('Certificate uploaded and verified successfully!');
      } else {
        toast.success('Certificate uploaded successfully! Verification may be pending.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed. Please try again.';
      const errorDetails = error.response?.data?.details || '';
      
      toast.error(`Upload failed: ${errorMessage}`);
      setResult({
        error: true,
        message: errorMessage,
        details: errorDetails,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Upload Certificate</h1>
          <p className="mt-2 text-gray-600">
            Upload your PDF certificate for verification and storage
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Certificate</h2>
            
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your PDF here, or click to select
                </h3>
                <p className="text-gray-600 mb-4">
                  Only PDF files are supported
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="btn-primary cursor-pointer inline-block"
                >
                  Choose File
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Info */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-8 h-8 text-primary-600 mr-3" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{file.name}</h4>
                    <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={uploading}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading and verifying...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <Loader size="sm" text="" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Verify</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </Card>

          {/* Results Section */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Verification Results</h2>
            
            {!result ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
                <p className="text-gray-600">
                  Upload a certificate to see verification results
                </p>
              </div>
            ) : result.error ? (
              <div className="text-center py-8">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">Upload Failed</h3>
                <p className="text-red-600 mb-4">{result.message}</p>
                <button
                  onClick={resetUpload}
                  className="btn-secondary"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Certificate Uploaded Successfully!
                  </h3>
                </div>

                {/* Certificate Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Certificate ID:</span>
                      <p className="text-gray-900">{result.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <p className={result.verified ? 'text-success-600' : 'text-warning-600'}>
                        {result.verified ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Filename:</span>
                      <p className="text-gray-900">{result.originalName || result.filename}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Upload Date:</span>
                      <p className="text-gray-900">
                        {new Date(result.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Verification Report */}
                  {result.report && (
                    <div>
                      <span className="font-medium text-gray-700 block mb-2">Verification Report:</span>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-800 max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{result.report}</pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary flex-1"
                  >
                    View in Dashboard
                  </button>
                  <button
                    onClick={resetUpload}
                    className="btn-secondary flex-1"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Supported Files</h4>
              <ul className="space-y-1">
                <li>• PDF files only</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Digital certificates preferred</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Verification Process</h4>
              <ul className="space-y-1">
                <li>• Automatic QR code detection</li>
                <li>• Digital signature validation</li>
                <li>• External API verification</li>
                <li>• Detailed verification report</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
