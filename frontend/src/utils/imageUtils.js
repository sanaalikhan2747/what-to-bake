// Utility functions for payment screenshots and receipt generation

/**
 * Compresses any user-uploaded image to a lightweight JPEG and returns dataUrl, file, and blob.
 */
export async function compressScreenshot(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                dataUrl,
                blob: null,
                file,
                name: file.name || "payment_screenshot.jpg",
                sizeText: formatBytes(file.size),
              });
              return;
            }
            const cleanName = (file.name || "transfer_screenshot.jpg").replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanName, { type: "image/jpeg" });
            resolve({
              dataUrl,
              blob,
              file: compressedFile,
              name: cleanName,
              sizeText: formatBytes(blob.size),
            });
          },
          "image/jpeg",
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1000) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Copies an image blob to clipboard (converts to PNG if needed for browser compatibility)
 */
export async function copyImageToClipboard(blobOrDataUrl) {
  if (!navigator.clipboard || typeof window.ClipboardItem === "undefined") {
    return false;
  }
  try {
    let pngBlob;
    if (typeof blobOrDataUrl === "string" && blobOrDataUrl.startsWith("data:")) {
      pngBlob = await dataUrlToPngBlob(blobOrDataUrl);
    } else if (blobOrDataUrl instanceof Blob) {
      if (blobOrDataUrl.type === "image/png") {
        pngBlob = blobOrDataUrl;
      } else {
        pngBlob = await blobToPngBlob(blobOrDataUrl);
      }
    }
    if (!pngBlob) return false;

    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": pngBlob }),
    ]);
    return true;
  } catch (err) {
    console.warn("Failed to copy image to clipboard:", err);
    return false;
  }
}

async function dataUrlToPngBlob(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob), "image/png");
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

async function blobToPngBlob(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => resolve(b), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Generates an aesthetic bakery receipt slip image for the order
 */
export async function generateReceiptSlip(order) {
  if (!order) return null;

  const width = 640;
  // Estimate height based on item rows
  const rowCount = (order.items || []).length;
  const height = 720 + rowCount * 44;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#faf6f0";
  ctx.fillRect(0, 0, width, height);

  // Outer border & header
  ctx.strokeStyle = "#8d2c38";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Inner dotted border
  ctx.strokeStyle = "#d4bfa8";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(28, 28, width - 56, height - 56);
  ctx.setLineDash([]);

  // Title
  ctx.fillStyle = "#8d2c38";
  ctx.font = "bold 26px serif";
  ctx.textAlign = "center";
  ctx.fillText("Treats & Temptation by SK", width / 2, 75);

  ctx.fillStyle = "#6b5d52";
  ctx.font = "italic 14px sans-serif";
  ctx.fillText("Artisanal Home Bakery • Freshly Baked on Order", width / 2, 102);

  // Separator
  ctx.strokeStyle = "#8d2c38";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 125);
  ctx.lineTo(width - 50, 125);
  ctx.stroke();

  // Order Details
  ctx.textAlign = "left";
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = "#221d1b";
  ctx.fillText(`ORDER #: ${order.order_number}`, 50, 160);

  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#5c524c";
  const dateStr = new Date().toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  ctx.textAlign = "right";
  ctx.fillText(dateStr, width - 50, 160);

  ctx.textAlign = "left";
  ctx.fillText(`Customer: ${order.customer?.name || "Valued Customer"}`, 50, 185);
  ctx.fillText(`Phone: ${order.customer?.phone || ""}`, 50, 207);
  if (order.customer?.delivery_date) {
    ctx.fillText(`Delivery: ${order.customer.delivery_date}`, 50, 229);
  }

  // Items Header
  let y = order.customer?.delivery_date ? 265 : 245;
  ctx.fillStyle = "#e8ded2";
  ctx.fillRect(48, y, width - 96, 32);

  ctx.fillStyle = "#8d2c38";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("ITEM DESCRIPTION", 60, y + 21);
  ctx.textAlign = "right";
  ctx.fillText("TOTAL", width - 60, y + 21);

  // Items List
  y += 46;
  ctx.fillStyle = "#221d1b";
  (order.items || []).forEach((item) => {
    ctx.textAlign = "left";
    ctx.font = "14px sans-serif";
    const name = `${item.qty}× ${item.name}${item.custom_box ? " (single)" : ""}`;
    ctx.fillText(name.length > 36 ? name.slice(0, 36) + "…" : name, 60, y);

    ctx.textAlign = "right";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`Rs. ${Number(item.line_total || item.unit_price * item.qty).toLocaleString()}`, width - 60, y);
    y += 36;
  });

  if (order.packaging) {
    ctx.textAlign = "left";
    ctx.font = "italic 13px sans-serif";
    ctx.fillStyle = "#6b5d52";
    ctx.fillText(`Packaging: ${order.packaging.name}`, 60, y);
    ctx.textAlign = "right";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`Rs. ${order.packaging.price}`, width - 60, y);
    y += 34;
  }

  // Subtotal & Total
  ctx.strokeStyle = "#d4bfa8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, y);
  ctx.lineTo(width - 50, y);
  ctx.stroke();

  y += 28;
  ctx.fillStyle = "#8d2c38";
  ctx.font = "bold 18px serif";
  ctx.textAlign = "left";
  ctx.fillText("TOTAL AMOUNT:", 60, y);
  ctx.textAlign = "right";
  ctx.fillText(`Rs. ${Number(order.total).toLocaleString()}`, width - 60, y);

  // Bank Info Footer Box
  y += 34;
  ctx.fillStyle = "#fff";
  ctx.fillRect(48, y, width - 96, 120);
  ctx.strokeStyle = "#d4bfa8";
  ctx.strokeRect(48, y, width - 96, 120);

  ctx.textAlign = "left";
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = "#8d2c38";
  ctx.fillText("PAYMENT METHOD: ADVANCE BANK TRANSFER", 62, y + 25);

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#333";
  ctx.fillText("Bank: Allied bank", 62, y + 50);
  ctx.fillText("Account Title: Farzana seemin", 62, y + 72);
  ctx.font = "bold 12px monospace";
  ctx.fillText("IBAN: PK53ABPA0010070700810022", 62, y + 95);

  // Footer Thanks
  y += 150;
  ctx.textAlign = "center";
  ctx.fillStyle = "#8d2c38";
  ctx.font = "italic 14px serif";
  ctx.fillText("Thank you for ordering with Treats & Temptation by SK! ✨", width / 2, y);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const dataUrl = canvas.toDataURL("image/png");
      const file = blob
        ? new File([blob], `Order_Slip_${order.order_number}.png`, { type: "image/png" })
        : null;
      resolve({ blob, dataUrl, file, filename: `Order_Slip_${order.order_number}.png` });
    }, "image/png");
  });
}
