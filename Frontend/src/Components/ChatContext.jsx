import React,{ createContext, useContext, useState } from "react";
import ChatWindow from "./ChatWindow";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chatPeer, setChatPeer] = useState(null);

  const openChat = (peerId, peerName) => {
    console.log("🟢 Opening chat with:", peerName, peerId);
    setChatPeer({ peerId, peerName });
  };

  const closeChat = () => setChatPeer(null);

  return (
    <ChatContext.Provider value={{ openChat, closeChat }}>
      {children}
      {chatPeer && (
        <ChatWindow
          peerId={chatPeer.peerId}
          peerName={chatPeer.peerName}
          onClose={closeChat}
        />
      )}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
