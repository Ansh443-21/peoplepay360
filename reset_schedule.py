from backend.app.database import engine
from backend.app.schedules.model import Schedule

# Delete old schedules table
Schedule.__table__.drop(bind=engine, checkfirst=True)

# Create schedules table again using the current model
Schedule.__table__.create(bind=engine, checkfirst=True)

print("Schedules table reset successfully!")