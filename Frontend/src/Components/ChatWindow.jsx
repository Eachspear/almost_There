import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { createSocket, decodeUserIdFromToken } from "../lib/socket";

export default function ChatWindow({ peerId, peerName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(true);
  const socketRef = useRef(null);
  
  // Get user ID with fallback handling
  const me = (() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || payload._id;
    } catch (err) {
      console.error("Error decoding token:", err);
      return decodeUserIdFromToken(); // fallback to your existing function
    }
  })();

  // 🔹 FIRST useEffect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !peerId) return;

    // Load history
    const loadMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:8500/chat/history/${peerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const msgs = res.data?.messages || res.data || [];
        setMessages(msgs);
      } catch (e) {
        console.error("History fetch error", e);
      }
    };

    loadMessages();

    // Poll for new messages every 5 seconds when not connected
    let pollInterval;
    const startPolling = () => {
      pollInterval = setInterval(() => {
        const socket = socketRef.current;
        if (!socket || !socket.connected) {
          loadMessages(); // Refresh messages if socket is down
        }
      }, 5000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // cleanup
    return () => {
      stopPolling();
    };
  }, [peerId]);   // ✅ properly closed first useEffect

  // 🔹 SECOND useEffect (socket setup)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !peerId) return;

    // Load history (again, on socket mount)
    axios
      .get(`http://localhost:8500/chat/history/${peerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const msgs = res.data?.messages || res.data || [];
        setMessages(msgs);
      })
      .catch((e) => {
        console.error("History fetch error", e);
      });

    // Setup socket
    try {
      const s = createSocket();
      socketRef.current = s;
      
      s.on("connect", () => {
        setConnecting(false);
        console.log("Socket connected, will receive any offline messages");
      });
      
      s.on("disconnect", () => {
        setConnecting(true);
        console.log("Socket disconnected");
      });

      const handleMessage = (msg) => {
        console.log("Received message:", msg);
        if (
          (String(msg.from) === String(me) && String(msg.to) === String(peerId)) ||
          (String(msg.from) === String(peerId) && String(msg.to) === String(me))
        ) {
          setMessages((prev) => {
            const exists = prev.some((m) => 
              m._id === msg._id || 
              (m.optimistic && m.text === msg.text && String(m.from) === String(msg.from) && String(m.to) === String(msg.to))
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

  // send function
  const send = async () => {
    const text = (input || "").trim();
    if (!text || !peerId) return;
    const token = localStorage.getItem("token");

    // Optimistic append
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic = {
      _id: tempId,
      from: me,
      to: peerId,
      text,
      createdAt: new Date().toISOString(),
      read: false,
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    // Try realtime
    const s = socketRef.current;
    if (s && s.connected) {
      s.emit("send_message", { to: peerId, text }, (ack) => {
        if (ack?.ok && ack.message?._id) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? ack.message : m))
          );
        } else {
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
        }
      });
      return;
    }

    // REST fallback
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

  // scroll effect
  useEffect(() => {
    const el = document.getElementById("chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] max-w-[95vw]">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">
            Chat with {peerName || peerId}
            {connecting && (
              <span className="ml-2 text-xs text-gray-500">(connecting…)</span>
            )}
          </div>
          <button className="text-gray-500 hover:text-black" onClick={onClose}>
            ✕
          </button>
        </div>

        <div id="chat-scroll" className="h-[360px] overflow-y-auto p-4 space-y-2">
          {messages.map((m, index) => {
            const uniqueKey = m._id || `fallback-${index}-${m.createdAt}-${m.text?.slice(0, 10)}`;
            return (
              <div
                key={uniqueKey}
                className={
                  "flex " +
                  (String(m.from) === String(me) ? "justify-end" : "justify-start")
                }
              >
                <div
                  className={(String(m.from) === String(me) ? "bg-rose-500 text-white" : "bg-gray-200 text-gray-900") + " px-3 py-2 rounded-xl max-w-[75%]"}
                >
                  <div className="text-sm">{m.text}</div>
                  <div className="text-[10px] opacity-70 mt-1">
                    {new Date(m.createdAt || Date.now()).toLocaleTimeString()}
                    {m.optimistic ? " • sending…" : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            onClick={send}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
