#!/bin/bash

# Variables
SERVICE_NAME="py-cs-folio"
WORKING_DIR="$PWD"
VENV_DIR="$WORKING_DIR/venv"
EXECUTABLE="$VENV_DIR/bin/python3 app.py"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

# Check if the script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root."
  exit 1
fi

# Create a Python virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv "$VENV_DIR"
  echo "Virtual environment created at $VENV_DIR."
fi

# Activate the virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip after activating the virtual environment
pip install --upgrade pip

pip install -r requirements.txt

# Create the systemd service file
cat << EOF > $SERVICE_FILE
[Unit]
Description=Python CS Folio
After=network.target

[Service]
Type=simple
WorkingDirectory=$WORKING_DIR
ExecStart=$EXECUTABLE
Restart=always
User=$(whoami)
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

# Set the correct permissions
chmod 644 $SERVICE_FILE

# Reload systemd to recognize the new service
systemctl daemon-reload

# Enable the service to start on boot
systemctl enable $SERVICE_NAME

# Start the service
systemctl start $SERVICE_NAME

# Check the service status
systemctl status $SERVICE_NAME
