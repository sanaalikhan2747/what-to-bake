import { ArrowRight, Instagram, MessageCircle, Phone } from "lucide-react";
import { waLink, WHATSAPP_PHONE } from "@/state/api";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <section className="footer-contact" aria-labelledby="footer-contact-title" data-testid="footer-contact">
        <div className="footer-contact-intro">
          <p className="eyebrow">CONTACT</p>
          <h2 id="footer-contact-title">Get in Touch</h2>
          <p>For orders, custom gift boxes, or dietary requests, reach out directly.</p>
        </div>
        <div className="footer-contact-details">
          <a className="footer-contact-method" href={`tel:+${WHATSAPP_PHONE}`} data-testid="contact-phone">
            <span className="footer-contact-icon"><Phone size={19} /></span>
            <span className="footer-contact-copy">
              <small>CALL OR WHATSAPP</small>
              <b>+92 322 411 2832</b>
              <em>Direct inquiries &amp; orders</em>
            </span>
            <ArrowRight size={17} />
          </a>
          <a className="footer-contact-method" href={waLink("Hello Sana! I have a question about a bake or order.")} target="_blank" rel="noreferrer" data-testid="contact-whatsapp">
            <span className="footer-contact-icon"><MessageCircle size={19} /></span>
            <span className="footer-contact-copy">
              <small>MESSAGE THE BAKER</small>
              <b>Chat on WhatsApp</b>
              <em>Direct message for quick replies</em>
            </span>
            <ArrowRight size={17} />
          </a>
          <a className="footer-contact-method" href="https://www.instagram.com/treatsandtemptationbysk/" target="_blank" rel="noreferrer" data-testid="contact-instagram">
            <span className="footer-contact-icon"><Instagram size={19} /></span>
            <span className="footer-contact-copy">
              <small>INSTAGRAM</small>
              <b>@treatsandtemptationbysk</b>
              <em>Latest bakes &amp; updates</em>
            </span>
            <ArrowRight size={17} />
          </a>
          <p className="footer-pickup-note"><b>Pick-up Location:</b> Askari X, Lahore · Confirmed upon order booking.</p>
        </div>
      </section>
      <div className="footer-bottom">
        <div className="brand">
          <span className="brand-mark">SK</span>
          <span>Treats &amp;<br /><b>Temptation</b></span>
        </div>
        <span className="footer-signoff">Artisanal Small-Batch Bakery · Lahore, Pakistan</span>
        <a href="https://www.instagram.com/treatsandtemptationbysk/" target="_blank" rel="noreferrer" data-testid="footer-instagram">
          @treatsandtemptationbysk <Instagram size={16} />
        </a>
      </div>
    </footer>
  );
}
