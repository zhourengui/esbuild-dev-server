(() => {
  // main.ts
  if (true) {
    new EventSource("/esbuild").addEventListener("change", () => {
      location.reload();
    });
  }
})();
