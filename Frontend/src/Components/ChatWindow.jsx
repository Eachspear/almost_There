import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { createSocket, decodeUserIdFromToken } from "../lib/socket";
import { Send, WifiOff, Wifi } from "lucide-react";
import "./styles/ChatWindow.css";

export default function ChatWindow({ peerId, peerName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(true);
  const socketRef = useRef(null);

  const me = (() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.id || payload._id;
    } catch (err) {
      console.error("Error decoding token:", err);
      return decodeUserIdFromToken();
    }
  })();

  // 🧠 Fetch chat history
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !peerId) return;

    const loadMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:8500/chat/history/${peerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data?.messages || []);
      } catch (e) {
        console.error("History fetch error", e);
      }
    };

    loadMessages();
  }, [peerId]);

  // ⚡ Setup socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !peerId) return;

    try {
      const s = createSocket();
      socketRef.current = s;

      s.on("connect", () => {
        setConnecting(false);
      });
      s.on("disconnect", () => {
        setConnecting(true);
      });

      const handleMessage = (msg) => {
        if (
          (String(msg.from) === String(me) && String(msg.to) === String(peerId)) ||
          (String(msg.from) === String(peerId) && String(msg.to) === String(me))
        ) {
          setMessages((prev) => {
            const exists = prev.some(
              (m) =>
                m._id === msg._id ||
                (m.optimistic &&
                  m.text === msg.text &&
                  String(m.from) === String(msg.from) &&
                  String(m.to) === String(msg.to))
            );
            if (exists) return prev;
            return [...prev, msg];
          });
        }
      };

      s.on("message", handleMessage);
      return () => {
        s.off("message", handleMessage);
        s.close();
      };
    } catch (err) {
      console.warn("Socket setup failed; offline mode only", err);
      setConnecting(false);
    }
  }, [peerId, me]);

  // 💬 Send message
  const send = async () => {
    const text = input.trim();
    if (!text || !peerId) return;
    const token = localStorage.getItem("token");

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      from: me,
      to: peerId,
      text,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    const s = socketRef.current;
    if (s && s.connected) {
      s.emit("send_message", { to: peerId, text }, (ack) => {
        if (ack?.ok && ack.message?._id) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? ack.message : m))
          );
        }
      });
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:8500/chat/send`,
        { to: peerId, text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const saved = res.data?.message;
      if (saved?._id) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? saved : m))
        );
      }
    } catch (e) {
      console.error("REST send failed", e);
    }
  };

  // Auto-scroll
  useEffect(() => {
    const el = document.getElementById("chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="chat-overlay">
      <div className="chat-window">
        {/* Header */}
        <div className="chat-header">
          <div>
            <h3 className="chat-peer-name">{peerName || "User"}</h3>
            <span className="chat-status">
              {connecting ? (
                <>
                  <WifiOff size={12} className="inline mr-1 text-red-400" /> Offline
                </>
              ) : (
                <>
                  <Wifi size={12} className="inline mr-1 text-emerald-400" /> Connected
                </>
              )}
            </span>
          </div>
          <button onClick={onClose} className="chat-close-btn">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div id="chat-scroll" className="chat-body">
          {messages.map((m, i) => (
            <div
              key={m._id || i}
              className={`chat-bubble ${
                String(m.from) === String(me) ? "sent" : "received"
              }`}
            >
              <div className="chat-text">{m.text}</div>
              <div className="chat-time">
                {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {m.optimistic ? " • sending..." : ""}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="chat-input-bar">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send} className="chat-send-btn">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
