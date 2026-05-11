import { useRef, useState, useCallback } from "react";
import {
  IconCloudUpload,
  IconFolderOpen,
  IconShieldLock,
  IconEyeOff,
  IconLock,
} from "@tabler/icons-react";
import styles from "./upload-card.module.css";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const FORMAT_CHIPS = ["PNG", "JPG", "PDF", "Photo"];

interface UploadCardProps {
  onContinue?: (file: File) => void;
  isLoading?: boolean;
  errorMessage?: string;
  /** Called when user picks or drops a new file (e.g. clear prior API errors). */
  onFileChange?: () => void;
}

export function UploadCard({
  onContinue,
  isLoading = false,
  errorMessage,
  onFileChange,
}: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (f: File) => {
      setFile(f);
      onFileChange?.();
    },
    [onFileChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const canContinue = !!file && !isLoading;

  return (
    <div className={styles.card}>
      <div
        className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ""} ${file ? styles.dropZoneReady : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drop zone — click or drag to upload"
        onKeyDown={(e) => {
          if (!isLoading && e.key === "Enter") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className={styles.hiddenInput}
          onChange={onInputChange}
          disabled={isLoading}
          aria-hidden
        />
        <div className={styles.dropIcon}>
          <IconCloudUpload size={40} stroke={1.5} aria-hidden />
        </div>
        {file ? (
          <>
            <p className={styles.dropTitle}>{file.name}</p>
            <p className={styles.dropSub}>
              {(file.size / 1024).toFixed(0)} KB · ready to upload
            </p>
          </>
        ) : (
          <>
            <p className={styles.dropTitle}>Drop your file here</p>
            <p className={styles.dropSub}>
              Drag and drop your form to get started
            </p>
          </>
        )}
      </div>

      <div className={styles.orRow}>
        <div className={styles.orLine} />
        <span className={styles.orText}>or choose manually</span>
        <div className={styles.orLine} />
      </div>

      <button
        className={styles.chooseBtn}
        type="button"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
      >
        <IconFolderOpen
          size={15}
          color="var(--color-text-secondary)"
          aria-hidden
        />
        Choose file from device
      </button>

      <div className={styles.chipRow}>
        {FORMAT_CHIPS.map((fmt) => (
          <span key={fmt} className={styles.chip}>
            {fmt}
          </span>
        ))}
      </div>

      {errorMessage ? (
        <p className={styles.errorBanner} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        className={styles.ctaBtn}
        type="button"
        disabled={!canContinue}
        onClick={() => file && onContinue?.(file)}
        aria-disabled={!canContinue}
      >
        {isLoading ? "Uploading…" : "Upload and continue"}
      </button>

      <div className={styles.trustRow}>
        <div className={styles.trustItem}>
          <IconShieldLock size={12} color="var(--color-brand)" aria-hidden />
          <span>Encrypted</span>
        </div>
        <div className={styles.trustDot} />
        <div className={styles.trustItem}>
          <IconEyeOff size={12} color="var(--color-brand)" aria-hidden />
          <span>Not stored</span>
        </div>
        <div className={styles.trustDot} />
        <div className={styles.trustItem}>
          <IconLock size={12} color="var(--color-brand)" aria-hidden />
          <span>Private</span>
        </div>
      </div>
    </div>
  );
}
