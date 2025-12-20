import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

import { registerModalHandler } from "../../Utils/modalHandler";
import AlertModal from "./AlertModal";

const ModalContext = createContext();
export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({ open: false, title: "", message: "", variant: "info" });

  const showModal = useCallback(({ title = "Peringatan", message = "", variant = "info" }) => {
    setModal({ open: true, title, message, variant });
  }, []);

  const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  useEffect(() => {
    registerModalHandler(showModal);
  }, [showModal]);

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      <AlertModal {...modal} onClose={closeModal} />
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);