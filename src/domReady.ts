export function domReady(cb: () => void): void {
  if (typeof document === "undefined") return
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cb)
  } else {
    cb()
  }
}
