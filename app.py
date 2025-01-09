from scrapper import scrap_update
from flask import Flask, request, render_template, send_from_directory
from datas import REQUESTED_CONTAINERS, REQUESTED_CONTAINERS_CSV, REQUESTED_CONTAINERS_LINKS, DATA_DIR

import threading
import time

app = Flask(__name__)
updating_seconds=4*3600

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        return "Hello from POST!"
    else:
        return render_template('index.html', csv_files=REQUESTED_CONTAINERS_CSV, item_names=REQUESTED_CONTAINERS, item_links=REQUESTED_CONTAINERS_LINKS)

@app.route('/data/<filename>')
def get_data_file(filename):
    # This route will serve files from the DATA_DIR
    return send_from_directory(DATA_DIR, filename)

def updater():
    while True:
        print("Updating data")
        scrap_update()
        time.sleep(updating_seconds)

if __name__ == '__main__':
    thread = threading.Thread(target=updater, daemon=True)
    thread.start()

    # Run the Flask development server
    app.run(host='0.0.0.0', port=5000, debug=True)
