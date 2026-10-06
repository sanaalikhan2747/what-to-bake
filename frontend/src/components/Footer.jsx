import { ArrowRight, Instagram, MessageCircle, Phone } from "lucide-react";
import { waLink, WHATSAPP_PHONE } from "@/state/api";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <section className="footer-contact" aria-labelledby="footer-contact-title" data-testid="footer-contact">
        <div className="footer-contact-intro">
          <p className="eyebrow">SAY HELLO</p>
          <h2 id="footer-contact-title">A little question?<br /><em>We’re here.</em></h2>
          <p>Need help choosing a bake, checking an order, or arranging a pick-up? Send Sana a note and she’ll get back to you.</p>
        </div>
        <div className="footer-contact-details">
          <a className="footer-contact-method" href={`tel:+${WHATSAPP_PHONE}`} data-testid="contact-phone">
            <span className="footer-contact-icon"><Phone size={19} /></span>
            <span className="footer-contact-copy">
              <small>CALL OR WHATSAPP</small>
              <b>+92 322 411 2832</b>
              <em>Orders, questions & pick-up arrangements</em>
            </span>
            <ArrowRight size={17} />
          </a>
          <a className="footer-contact-method" href={waLink("Hello Sana! I have a question about a bake or order.")} target="_blank" rel="noreferrer" data-testid="contact-whatsapp">
            <span className="footer-contact-icon"><MessageCircle size={19} /></span>
            <span className="footer-contact-copy">
              <small>MESSAGE THE BAKER</small>
              <b>Chat on WhatsApp</b>
              <em>Tell us what you’re planning</em>
            </span>
            <ArrowRight size={17} />
          </a>
          <a className="footer-contact-method" href="https://www.instagram.com/treatsandtemptationbysk/" target="_blank" rel="noreferrer" data-testid="contact-instagram">
            <span className="footer-contact-icon"><Instagram size={19} /></span>
            <span className="footer-contact-copy">
              <small>FOLLOW ALONG</small>
              <b>@treatsandtemptationbysk</b>
              <em>Fresh bakes and kitchen moments</em>
            </span>
            <ArrowRight size={17} />
          </a>
          <p className="footer-pickup-note"><b>Pick-up:</b> Sana confirms availability, timing, and the pick-up location with you directly when arranging your order.</p>
        </div>
      </section>
      <div className="footer-bottom">
        <div className="brand">
          <span className="brand-mark">SK</span>
          <span>Treats &<br /><b>Temptation</b></span>
        </div>
        <span className="footer-signoff">Made with butter, time & a little bit of magic.</span>
        <a href="https://www.instagram.com/treatsandtemptationbysk/" target="_blank" rel="noreferrer" data-testid="footer-instagram">
          @treatsandtemptationbysk <Instagram size={16} />
        </a>
      </div>
    </footer>
  );
}
