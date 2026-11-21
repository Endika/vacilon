export const TEMPLATE = `
<main class="screen" data-loading="true">
  <div class="bubble" data-thinking="false">
    <p class="said" id="said" aria-live="polite"></p>
    <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
  </div>
  <div class="stage">
    <button class="chispa" id="chispa" type="button" aria-label="Hacerle cosquillas a Chispa"></button>
    <p class="voice-status" id="voice-status" role="status" hidden>
      <i aria-hidden="true"></i><span id="voice-status-text"></span>
    </p>
    <button class="mute" id="mute" type="button" aria-pressed="false" aria-label="Silenciar la voz">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path class="speaker" d="M4 9v6h4l5 4V5L8 9H4z" />
        <path class="waves" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
        <path class="slash" d="M4 4l16 16" />
      </svg>
    </button>
  <button class="install" id="install" type="button" hidden aria-label="Instalar Chispa">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v10M7.5 10 12 14.5 16.5 10M5 19h14" />
    </svg>
  </button>
  </div>
  <div class="guide" id="guide" role="dialog" aria-label="Instalar Chispa" hidden>
    <p>Pulsa <b>Compartir</b> y luego «Añadir a pantalla de inicio» para tener a Chispa en tu móvil.</p>
    <button type="button">Vale</button>
  </div>
  <form class="composer" id="composer" autocomplete="off">
    <input id="message" name="message" type="text" maxlength="200" enterkeyhint="send"
      placeholder="Escríbele…" aria-label="Mensaje para Chispa" />
    <button class="mic" id="mic" type="button" aria-pressed="false" aria-label="Toca para hablar" hidden>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
      </svg>
    </button>
    <button class="send" id="send" type="submit">Enviar</button>
  </form>
  <div class="loader" id="loader" role="status">
    <p class="loader-text" id="loader-text">Chispa se está despertando…</p>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" id="bar">
      <span id="bar-fill"></span>
    </div>
  </div>
</main>
`;

export function mountTemplate(host: HTMLElement): void {
  host.innerHTML = TEMPLATE;
}
