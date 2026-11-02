import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Info,
  MessageCircle,
  Share2,
} from "lucide-react";
import { api, waLink } from "@/state/api";
import { PAYMENT_CONFIG } from "@/state/paymentConfig";
import PaymentScreenshotUploader from "@/components/PaymentScreenshotUploader";
import { copyImageToClipboard, generateReceiptSlip } from "@/utils/imageUtils";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [ibanCopied, setIbanCopied] = useState(false);
  const [screenshot, setScreenshot] = useState(location.state?.screenshot || null);
  const [savingSlip, setSavingSlip] = useState(false);
  const [slipDownloaded, setSlipDownloaded] = useState(false);
  const [showPasteNotice, setShowPasteNotice] = useState(false);
  const [syncingScreenshot, setSyncingScreenshot] = useState(false);

  useEffect(() => {
    api
      .get(`/orders/${orderNumber}`)
      .then((r) => {
        setOrder(r.data);
        setScreenshot((prev) => {
          if (!prev && r.data?.payment_screenshot) {
            return {
              dataUrl: r.data.payment_screenshot,
              name: "transfer_screenshot.jpg",
              sizeText: "Attached",
            };
          }
          return prev;
        });
      })
      .catch(() => setError("We couldn't find that order."));
  }, [orderNumber]);

  const handleScreenshotChange = async (sc) => {
    setScreenshot(sc);
    if (!sc) return;
    setSyncingScreenshot(true);
    try {
      await api.post(`/orders/${orderNumber}/screenshot`, {
        payment_screenshot: sc.dataUrl,
      });
    } catch (err) {
      console.warn("Could not save screenshot to server:", err);
    } finally {
      setSyncingScreenshot(false);
    }
  };

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_CONFIG.iban);
      setIbanCopied(true);
      setTimeout(() => setIbanCopied(false), 2000);
    } catch {}
  };

  const waMessage =
    order &&
    (() => {
      const lines = order.items
        .map(
          (i) =>
            `• ${i.qty}× ${i.name}${i.custom_box ? " (single)" : ""} — Rs. ${i.line_total.toLocaleString()}`
        )
        .join("\n");
      const parts = [
        `Hello Treats & Temptation by SK!`,
        `New order ${order.order_number}`,
        `Name: ${order.customer.name}`,
        `Phone: ${order.customer.phone}`,
        `Address: ${order.customer.address}`,
      ];
      if (order.customer.delivery_date)
        parts.push(`Delivery: ${order.customer.delivery_date}`);
      parts.push("", "Items:", lines);
      if (order.packaging)
        parts.push(
          "",
          `Packaging: ${order.packaging.name} (Rs. ${order.packaging.price})`
        );
      if (order.personalized_message)
        parts.push(`Note on box: "${order.personalized_message}"`);
      if (order.customer.notes) parts.push(`Notes: ${order.customer.notes}`);
      parts.push(
        "",
        `Total: Rs. ${order.total.toLocaleString()}`,
        "",
        `Payment Method: Advance Bank Transfer`,
        `• Bank: ${PAYMENT_CONFIG.bankName}`,
        `• Account Title: ${PAYMENT_CONFIG.accountTitle}`,
        `• IBAN: ${PAYMENT_CONFIG.iban}`,
        "",
        screenshot
          ? `📸 Transfer Screenshot: Attached / Sent ✨`
          : `📸 Transfer Screenshot: Sending shortly ✨`
      );
      return parts.join("\n");
    })();

  const copyOrder = async () => {
    if (!waMessage) return;
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareToWhatsApp = async () => {
    if (!order || !waMessage) return;

    // 1. Mobile native share sheet with file support (Android / iOS):
    if (
      screenshot?.file &&
      navigator.canShare &&
      navigator.canShare({ files: [screenshot.file] })
    ) {
      try {
        await navigator.share({
          files: [screenshot.file],
          title: `Treats & Temptation Order ${order.order_number}`,
          text: waMessage,
        });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
        console.warn("Native share error, falling back to direct link", err);
      }
    }

    // 2. Desktop / standard fallback: copy image to clipboard and open WhatsApp
    if (screenshot?.blob || screenshot?.dataUrl) {
      const ok = await copyImageToClipboard(screenshot.blob || screenshot.dataUrl);
      if (ok) {
        setShowPasteNotice(true);
      }
    }

    window.open(waLink(waMessage), "_blank", "noopener,noreferrer");
  };

  const downloadReceiptSlipImage = async () => {
    if (!order) return;
    setSavingSlip(true);
    try {
      const slip = await generateReceiptSlip(order);
      if (!slip) return;
      const a = document.createElement("a");
      a.href = slip.dataUrl;
      a.download = slip.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSlipDownloaded(true);
      setTimeout(() => setSlipDownloaded(false), 3500);
    } catch (err) {
      console.error("Failed to generate slip:", err);
    } finally {
      setSavingSlip(false);
    }
  };

  if (error) {
    return (
      <div className="success-page">
        <h1>Hmm, we couldn't find that order.</h1>
        <p>
          Please check the link or <Link to="/menu">browse the menu</Link>.
        </p>
      </div>
    );
  }
  if (!order)
    return (
      <div className="success-page">
        <p>Fetching your order…</p>
      </div>
    );

  return (
    <div className="success-page">
      <div className="success-badge">
        <CheckCircle2 size={26} />
      </div>
      <p className="eyebrow">ORDER RECEIVED</p>
      <h1>
        Thank you, {order.customer.name.split(" ")[0]}.<br />
        <em>Your box is almost confirmed.</em>
      </h1>
      <p className="success-lead">
        Your order number is <b data-testid="order-number">{order.order_number}</b>. All our bakes are freshly prepared on order. Orders are confirmed once advance payment is received.
      </p>

      {/* Prominent Payment Details Card */}
      <section className="order-payment-box" data-testid="order-payment-card">
        <div className="order-payment-banner">
          <p className="order-payment-thanks">{PAYMENT_CONFIG.thankYou}</p>
          <div className="order-payment-total">
            <span>Total to transfer:</span>
            <strong>Rs. {order.total.toLocaleString()}</strong>
          </div>
          <p className="order-payment-prompt">{PAYMENT_CONFIG.prompt}</p>
        </div>

        <div className="bank-details-box">
          <div className="bank-detail-row">
            <span className="bank-label">Bank</span>
            <span className="bank-val">{PAYMENT_CONFIG.bankName}</span>
          </div>
          <div className="bank-detail-row">
            <span className="bank-label">Account Title</span>
            <span className="bank-val">{PAYMENT_CONFIG.accountTitle}</span>
          </div>
          <div className="bank-detail-row iban-row">
            <div>
              <span className="bank-label">IBAN</span>
              <code className="bank-iban" data-testid="success-bank-iban">
                {PAYMENT_CONFIG.iban}
              </code>
            </div>
            <button
              type="button"
              className="button-copy-iban"
              onClick={copyIban}
              data-testid="success-copy-iban"
            >
              {ibanCopied ? <Check size={14} /> : <Copy size={14} />}
              <span>{ibanCopied ? "Copied" : "Copy IBAN"}</span>
            </button>
          </div>
        </div>

        {/* Screenshot Section */}
        <div className="order-screenshot-section" data-testid="order-screenshot-block">
          <PaymentScreenshotUploader
            screenshot={screenshot}
            onScreenshotChange={handleScreenshotChange}
            title={screenshot ? "Payment Screenshot Attached" : "Attach Bank Transfer Screenshot"}
            subtitle={
              screenshot
                ? "Your transfer screenshot is attached and ready to share directly with SK on WhatsApp!"
                : "Done with the transfer in your bank app? Take or select a screenshot so it can be shared directly with SK on WhatsApp."
            }
            testIdPrefix="order-screenshot"
          />
          {syncingScreenshot && (
            <p className="syncing-note">Saving screenshot to order details…</p>
          )}
        </div>
      </section>

      {/* Paste Notification Banner */}
      {showPasteNotice && (
        <div className="paste-notice-banner" data-testid="paste-notice">
          <Info size={18} />
          <div>
            <strong>Screenshot copied to clipboard!</strong>
            <p>In the WhatsApp chat with SK, simply press <b>Ctrl+V</b> (or tap <b>Paste</b>) to send the receipt image along with your order details.</p>
          </div>
          <button
            type="button"
            className="button-sm ghost"
            onClick={() => setShowPasteNotice(false)}
          >
            Got it
          </button>
        </div>
      )}

      {/* Main Actions */}
      <div className="success-actions">
        <button
          type="button"
          className="button primary wide button-share-wa"
          onClick={shareToWhatsApp}
          data-testid="order-whatsapp"
        >
          <span>Share Order &amp; Screenshot on WhatsApp</span>
          <MessageCircle size={18} />
        </button>

        <div className="secondary-action-row">
          <button
            type="button"
            className="button ghost"
            onClick={downloadReceiptSlipImage}
            disabled={savingSlip}
            data-testid="download-receipt-slip"
          >
            {slipDownloaded ? (
              <>Slip Downloaded! <Check size={14} /></>
            ) : savingSlip ? (
              "Generating Slip…"
            ) : (
              <>Save Order Slip <Download size={14} /></>
            )}
          </button>

          <button
            type="button"
            className="button ghost"
            onClick={copyOrder}
            data-testid="order-copy"
          >
            {copied ? (
              <>Copied! <Check size={14} /></>
            ) : (
              <>Copy Details <Copy size={14} /></>
            )}
          </button>
        </div>
      </div>

      <div className="success-summary">
        <h3>Order summary</h3>
        {order.items.map((i) => (
          <div
            className="summary-row plain"
            key={(i.custom_box ? "c-" : "") + i.product_id}
          >
            <img src={i.image} alt={i.name} />
            <div>
              <b>
                {i.qty}× {i.name}
                {i.custom_box ? " (single)" : ""}
              </b>
              <small>Rs. {i.unit_price.toLocaleString()} each</small>
            </div>
            <strong>Rs. {i.line_total.toLocaleString()}</strong>
          </div>
        ))}
        <div className="summary-line">
          <span>Subtotal</span>
          <b>Rs. {order.subtotal.toLocaleString()}</b>
        </div>
        {order.packaging && (
          <div className="summary-line">
            <span>{order.packaging.name}</span>
            <b>Rs. {order.packaging.price}</b>
          </div>
        )}
        <div className="summary-line total">
          <span>Total</span>
          <b data-testid="order-total">Rs. {order.total.toLocaleString()}</b>
        </div>
        {order.personalized_message && (
          <p className="summary-message">"{order.personalized_message}"</p>
        )}
        <div className="success-customer">
          <b>{order.customer.name}</b>
          <span>{order.customer.phone}</span>
          <span>{order.customer.address}</span>
          {order.customer.delivery_date && (
            <span>Delivery: {order.customer.delivery_date}</span>
          )}
        </div>
      </div>

      <Link to="/" className="preview-link">
        ← back to home
      </Link>
    </div>
  );
}
