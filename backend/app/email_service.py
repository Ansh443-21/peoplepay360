import resend

from app.config import get_settings


def send_otp_email(to_email: str, otp: str) -> None:
    settings = get_settings()

    resend.api_key = settings.RESEND_API_KEY

    resend.Emails.send(
        {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": "PeoplePay360 Password Reset OTP",
            "html": f"""
                <h2>PeoplePay360</h2>
                <p>Your password reset OTP is:</p>
                <h1>{otp}</h1>
                <p>This OTP is valid for 10 minutes.</p>
                <p>If you did not request this password reset, you can ignore this email.</p>
            """,
        }
    )