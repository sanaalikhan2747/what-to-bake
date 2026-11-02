import React, { useRef, useState } from "react";
import { Camera, Check, Eye, Image as ImageIcon, Trash2, UploadCloud, X } from "lucide-react";
import { compressScreenshot } from "@/utils/imageUtils";

export default function PaymentScreenshotUploader({
  screenshot,
  onScreenshotChange,
  title = "Attach Payment Screenshot / Transfer Receipt",
  subtitle = "Made the transfer to Farzana seemin? Attach your screenshot here and it will be directly shared to WhatsApp!",
  compact = false,
  testIdPrefix = "payment-screenshot",
}) {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await compressScreenshot(file);
      onScreenshotChange(result);
    } catch (err) {
      console.error("Image compression error:", err);
      setError("Failed to load image. Please try another screenshot.");
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  };

  return (
    <div
      className={`screenshot-uploader-wrap ${compact ? "compact" : ""}`}
      onPaste={onPaste}
      tabIndex={0}
      data-testid={`${testIdPrefix}-uploader`}
    >
      <div className="uploader-header">
        <div className="uploader-title-group">
          <Camera size={16} className="uploader-icon" />
          <strong>{title}</strong>
        </div>
        {screenshot && (
          <span className="uploader-badge-ready">
            <Check size={12} /> Ready to send
          </span>
        )}
      </div>

      <p className="uploader-subtitle">{subtitle}</p>

      {error && <div className="uploader-error">{error}</div>}

      {screenshot ? (
        <div className="screenshot-preview-card" data-testid={`${testIdPrefix}-preview`}>
          <div className="screenshot-thumb-box" onClick={() => setPreviewOpen(true)}>
            <img src={screenshot.dataUrl} alt="Transfer screenshot preview" />
            <div className="thumb-zoom-overlay">
              <Eye size={16} />
              <span>View</span>
            </div>
          </div>

          <div className="screenshot-meta">
            <div className="screenshot-name-row">
              <span className="screenshot-filename">{screenshot.name || "transfer_screenshot.jpg"}</span>
              <span className="screenshot-filesize">{screenshot.sizeText}</span>
            </div>
            <p className="screenshot-status-text">
              ✨ Attached! When you click share on WhatsApp, this screenshot will be included.
            </p>
            <div className="screenshot-actions">
              <button
                type="button"
                className="button-sm ghost"
                onClick={() => fileInputRef.current?.click()}
                data-testid={`${testIdPrefix}-change-button`}
              >
                Change photo
              </button>
              <button
                type="button"
                className="button-sm remove"
                onClick={() => onScreenshotChange(null)}
                data-testid={`${testIdPrefix}-remove-button`}
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`uploader-dropzone ${dragOver ? "dragover" : ""} ${loading ? "loading" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid={`${testIdPrefix}-dropzone`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onInputChange}
            data-testid={`${testIdPrefix}-file-input`}
          />

          <div className="dropzone-content">
            <div className="dropzone-icon-circle">
              {loading ? (
                <div className="spinner-mini" />
              ) : (
                <UploadCloud size={22} className="dropzone-cloud-icon" />
              )}
            </div>

            <div className="dropzone-text">
              <strong>{loading ? "Preparing your screenshot…" : "Click to select or drag screenshot here"}</strong>
              <small>Take a photo, choose from mobile gallery, or paste (Ctrl+V)</small>
            </div>

            <div className="dropzone-browse-button">
              <ImageIcon size={14} />
              <span>Choose Screenshot</span>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewOpen && screenshot && (
        <div className="screenshot-modal-backdrop" onClick={() => setPreviewOpen(false)}>
          <div className="screenshot-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="screenshot-modal-close"
              onClick={() => setPreviewOpen(false)}
            >
              <X size={18} />
            </button>
            <img src={screenshot.dataUrl} alt="Transfer Screenshot Full View" />
            <div className="screenshot-modal-footer">
              <span>{screenshot.name}</span>
              <button
                type="button"
                className="button-sm ghost"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
