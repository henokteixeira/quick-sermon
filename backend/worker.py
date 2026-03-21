import asyncio
import signal

import structlog
from temporalio.client import Client
from temporalio.worker import Worker

from app.core.config import settings
from app.core.logging import setup_logging

logger = structlog.get_logger()

shutdown_event = asyncio.Event()


def handle_signal(sig: signal.Signals) -> None:
    logger.info("received_shutdown_signal", signal=sig.name)
    shutdown_event.set()


async def main() -> None:
    setup_logging(debug=settings.DEBUG)

    client = await Client.connect(
        settings.TEMPORAL_HOST,
        namespace=settings.TEMPORAL_NAMESPACE,
    )

    # Import workflows and activities here as they are implemented
    workflows: list = []
    activities: list = []

    worker = Worker(
        client,
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        workflows=workflows,
        activities=activities,
    )

    logger.info(
        "starting_worker",
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        host=settings.TEMPORAL_HOST,
    )

    async with worker:
        await shutdown_event.wait()

    logger.info("worker_stopped")


if __name__ == "__main__":
    loop = asyncio.new_event_loop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, handle_signal, sig)

    try:
        loop.run_until_complete(main())
    finally:
        loop.close()
