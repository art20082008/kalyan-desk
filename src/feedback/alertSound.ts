/**
 * Системный сигнал Windows играет процесс Electron через shell.beep().
 * В браузерном просмотре моста нет, поэтому цикл просто молчит.
 */
export function setAlertLoop(active: boolean): void {
  window.malewich?.alertLoop(active)
}
