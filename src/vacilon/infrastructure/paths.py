from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
WEB = ROOT / "web"
DEFAULT_MODEL_DIR = ROOT / "models" / "final"
DEFAULT_FINAL = DEFAULT_MODEL_DIR
DEFAULT_REGISTRY = ROOT / "models" / "registry"
DEFAULT_WEB_MODEL = WEB / "public" / "model"
DEFAULT_FIXTURES = WEB / "test" / "fixtures"
DEFAULT_MEMORY = WEB / "public" / "memory.json"
DEFAULT_GUARDRAILS = WEB / "src" / "domain" / "conversation" / "guardrails.json"
DEFAULT_BLOCKLIST = WEB / "src" / "domain" / "conversation" / "blocklist.json"
DEFAULT_MEMORY_CONFIG = WEB / "src" / "domain" / "brain" / "memory-config.json"
