// ============================================
// POS-Shop — Barcode Scanner Utility
// Uses the BarcodeDetector API or camera fallback
// ============================================

/**
 * Check if BarcodeDetector API is supported.
 */
export function isBarcodeSupported() {
  return 'BarcodeDetector' in window;
}

/**
 * Start barcode scanning using the device camera.
 * @param {HTMLVideoElement} videoEl - Video element to stream camera into
 * @param {Function} onDetected - Callback with barcode value
 * @returns {object} - { stop: Function }
 */
export function startBarcodeScanner(videoEl, onDetected) {
  let stream = null;
  let animationId = null;
  let detector = null;
  let running = true;

  async function init() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      videoEl.srcObject = stream;
      await videoEl.play();

      if (isBarcodeSupported()) {
        detector = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
        scan();
      } else {
        console.warn('BarcodeDetector API not supported. Manual barcode entry required.');
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      throw err;
    }
  }

  async function scan() {
    if (!running || !detector) return;

    try {
      const barcodes = await detector.detect(videoEl);
      if (barcodes.length > 0) {
        const barcode = barcodes[0];
        onDetected(barcode.rawValue, barcode.format);
        // Pause scanning briefly after detection
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (err) {
      // Detection errors are common, ignore silently
    }

    if (running) {
      animationId = requestAnimationFrame(scan);
    }
  }

  function stop() {
    running = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    videoEl.srcObject = null;
  }

  init().catch((err) => {
    console.error('Scanner init failed:', err);
  });

  return { stop };
}

/**
 * Manually enter a barcode (keyboard input handler for POS).
 * Many USB barcode scanners act as keyboard input.
 * @param {Function} onBarcode - Callback with barcode string
 * @returns {Function} cleanup function
 */
export function listenForBarcodeInput(onBarcode) {
  let buffer = '';
  let timeout = null;

  function handleKeyDown(e) {
    // Ignore if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // USB scanners typically end with Enter
    if (e.key === 'Enter' && buffer.length >= 4) {
      onBarcode(buffer);
      buffer = '';
      clearTimeout(timeout);
      return;
    }

    // Only accept printable characters
    if (e.key.length === 1) {
      buffer += e.key;
      clearTimeout(timeout);
      // Reset buffer after 100ms of no input (too slow for scanner)
      timeout = setTimeout(() => {
        buffer = '';
      }, 100);
    }
  }

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    clearTimeout(timeout);
  };
}

export default { isBarcodeSupported, startBarcodeScanner, listenForBarcodeInput };
