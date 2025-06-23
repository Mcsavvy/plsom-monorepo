import python_ms as ms
from datetime import timedelta


def ms_to_timedelta(ms_str: str) -> timedelta:
    """Convert human-readable time to a timedelta."""
    milliseconds = ms(ms_str) # type: ignore
    return timedelta(milliseconds=milliseconds)
