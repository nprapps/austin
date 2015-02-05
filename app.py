#!/usr/bin/env python

import json

from flask import Flask, make_response, render_template
from werkzeug.debug import DebuggedApplication

import app_config
from render_utils import make_context, smarty_filter, urlencode_filter
import static

app = Flask(__name__)
app.debug = app_config.DEBUG

app.add_template_filter(smarty_filter, name='smarty')
app.add_template_filter(urlencode_filter, name='urlencode')

# Example application views
@app.route('/')
def index():
    """
    Example view demonstrating rendering a simple HTML page.
    """
    context = make_context()

    with open('data/featured.json') as f:
        context['featured'] = json.load(f)

    with open('data/songs.json') as f:
        context['song_data'] = f.read()
        context['total_songs'] = len(json.loads(context['song_data']))

    return make_response(render_template('index.html', **context))

app.register_blueprint(static.static)

# Enable Werkzeug debug pages
if app_config.DEBUG:
    wsgi_app = DebuggedApplication(app, evalex=False)
else:
    wsgi_app = app

# Catch attempts to run the app directly
if __name__ == '__main__':
    print 'This command has been removed! Please run "fab app" instead!'
