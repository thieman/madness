import os

from flask import Flask, render_template
import pymongo

APP_PORT = 7654
PROJECT_ROOT = os.path.dirname(os.path.realpath(__file__))
#mongo = pymongo.Connection('localhost:27018')

app = Flask(__name__,
            static_folder=os.path.join(PROJECT_ROOT, 'static'),
            static_url_path='/static')

@app.route('/')
def app_root():
    return render_template('madness.html')

if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=APP_PORT)
