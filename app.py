import os
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/contact', methods=['POST'])
def contact():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        subject = data.get('subject')
        message = data.get('message')

        print(f"--- New Contact Message ---")
        print(f"From: {name} <{email}>")
        print(f"Subject: {subject}")
        print(f"Message: {message}")
        print(f"---------------------------")

        return jsonify({'status': 'success', 'message': 'Message received!'}), 200
    except Exception as e:
        print(f"Error processing contact form: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to process message.'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
