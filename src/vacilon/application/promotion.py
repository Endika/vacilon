from vacilon.application.ports import PromotionStore
from vacilon.domain.versions import RegistryError


def promote(store: PromotionStore, version: str, force: bool = False) -> bool:
    """Make `version` current; True when it was forced without a passing report."""
    if not store.has_model(version):
        raise RegistryError(f"{version} does not exist in the registry")
    certified = store.is_certified(version)
    if not certified and not force:
        raise RegistryError(f"{version} has no passing report.json (use --force to override)")
    store.activate(version)
    store.append_history(version)
    return not certified


def rollback(store: PromotionStore) -> str:
    """Go back to the version that was current before the present one."""
    trail = store.history()
    if len(trail) < 2:
        raise RegistryError("there is no previous version to go back to")
    previous = trail[-2]
    store.activate(previous)
    store.replace_history(trail[:-1])
    return previous
