/**
 * Один системный сигнал Windows через shell.beep().
 * В браузерном просмотре моста нет, поэтому вызов молчит.
 */
export function playAlertOnce(): void {
  window.malewich?.alertLoop(true)
}

export function stopAlertSound(): void {
  window.malewich?.alertLoop(false)
}
