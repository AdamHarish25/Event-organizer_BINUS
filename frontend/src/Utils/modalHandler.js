// simple bridge supaya kode non-React (axios interceptor) bisa memicu modal React
let _showModal = null;
export const registerModalHandler = (fn) => { _showModal = fn; };
export const showModalFromAnywhere = (opts) => {
  if (typeof _showModal === "function") _showModal(opts);
};

