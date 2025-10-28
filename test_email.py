#!/usr/bin/env python3
"""Test email sending functionality"""
import asyncio
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_EMAIL = os.environ.get('SMTP_EMAIL', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

async def test_email():
    """Send a test email"""
    
    print(f"SMTP Configuration:")
    print(f"  Host: {SMTP_HOST}")
    print(f"  Port: {SMTP_PORT}")
    print(f"  Email: {SMTP_EMAIL}")
    print(f"  Password: {'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else 'NOT SET'}")
    print()
    
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("❌ SMTP credentials not configured")
        return False
    
    # Create test email
    message = MIMEMultipart("alternative")
    message["Subject"] = "Test Email from Brothers of the Highway"
    message["From"] = SMTP_EMAIL
    message["To"] = SMTP_EMAIL  # Send to self for testing
    
    text = "This is a test email from the Brothers of the Highway Member Directory application."
    html = "<html><body><h2>Test Email</h2><p>This is a test email from the Brothers of the Highway Member Directory application.</p></body></html>"
    
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    message.attach(part1)
    message.attach(part2)
    
    try:
        print("🔄 Attempting to send email...")
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_EMAIL,
            password=SMTP_PASSWORD,
            use_tls=True,
            timeout=30
        )
        print(f"✅ Email sent successfully to {SMTP_EMAIL}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    asyncio.run(test_email())
