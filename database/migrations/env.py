import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Make `backend/app` importable when Alembic runs from database/migrations/
BACKEND_DIR = Path(__file__).resolve().parents[2] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from backend.app.config import get_settings   # noqa: E402
from backend.app.database import Base         # noqa: E402
# from backend.app.models import *            # uncomment once HR/payroll models exist

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Inject the real DB URL at runtime — never stored in alembic.ini.
# Alembic's config is a ConfigParser under the hood, which treats "%" as the
# start of an interpolation token on *retrieval* (get_main_option /
# get_section), regardless of how it was set. Supabase passwords can contain
# "%", so we escape it to "%%" here — ConfigParser un-escapes "%%" back to a
# literal "%" whenever the value is read later in this file.
settings = get_settings()
escaped_url = settings.DATABASE_URL.replace("%", "%%")
config.set_main_option("sqlalchemy.url", escaped_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_online() 
else:
    run_migrations_online()