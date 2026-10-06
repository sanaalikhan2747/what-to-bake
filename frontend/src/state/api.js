import axios from "axios";

const backendUrl = process.env.REACT_APP_BACKEND_URL || (
  process.env.NODE_ENV === "development" ? "http://127.0.0.1:8001" : ""
);

export const API = `${backendUrl}/api`;
export const WHATSAPP_PHONE = "923224112832"; // +92 322 4112832

export const api = axios.create({ baseURL: API });

export function waLink(text) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}
