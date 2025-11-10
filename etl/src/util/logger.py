from loguru import logger
import sys

logger.remove()
logger.add(
    sys.stdout,
    level="DEBUG",
    enqueue=True,  # Safe for multiprocessing (important for multiple Uvicorn workers)
    backtrace=True,
    diagnose=True,
)

# # Add a file sink
# logger.add(
#     "logs/etl.log",
#     rotation="10 MB",
#     retention="7 days",
#     level="INFO",
#     enqueue=True
# )

# Export logger for other modules
__all__ = ["logger"]
