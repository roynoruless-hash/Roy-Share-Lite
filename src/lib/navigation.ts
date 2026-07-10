export const navigate = (path: string) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event('pushstate'));
};
