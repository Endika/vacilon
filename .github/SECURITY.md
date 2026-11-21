# Security policy

## Reporting a vulnerability

Open a [private security advisory](https://github.com/Endika/vacilon/security/advisories/new).
Please do not file a public issue for anything exploitable.

Expect a first reply within 7 days.

## Threat model

Vacilon is a static, client-only PWA served from GitHub Pages: Chispa, a talking egg robot
for kids. It has no backend, no accounts, no API keys and no network calls at runtime beyond
fetching its own assets.

| Asset | Exposure | Control |
| --- | --- | --- |
| Microphone audio | A child's voice. | Recognised on-device by Vosk (WASM) and discarded. Nothing is stored, uploaded or logged. |
| Conversation text | What a child says to the robot. | Kept in memory for the session only. Never persisted, never transmitted. |
| Replies | Content shown to children. | Fixed safety phrases for sensitive topics, plus an output filter over everything the model generates. |
| Models and runtimes (`.onnx`, `.wasm`, Vosk model) | Supply chain: code and weights that execute locally. | Self-hosted and served same-origin from Pages. No third-party CDN at runtime. Updates go through a reviewed PR. |

### Privacy note

Because all inference (speech recognition, the language model and speech synthesis) runs in
the user's own browser, no personal data is transmitted. **Any change that sends audio or
text off-device is a breaking change to this policy** and must be called out explicitly in a
release note.

## Supported versions

Only the latest release, deployed at <https://endika.github.io/vacilon/>.
