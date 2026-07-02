import os

from flask import Flask, jsonify, render_template, request
from flask_login import LoginManager
from flask_wtf import CSRFProtect

from models import Owner, db

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'instance', 'cloth_store.db')}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["CLOTH_UPLOAD_DIR"] = os.path.join(basedir, "static", "uploads", "clothes")
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB max upload

db.init_app(app)
csrf = CSRFProtect(app)

login_manager = LoginManager()
login_manager.login_view = "admin.login"
login_manager.login_message_category = "error"
login_manager.init_app(app)


@login_manager.user_loader
def load_user(owner_id):
    return db.session.get(Owner, int(owner_id))


from admin import admin_bp  # noqa: E402

app.register_blueprint(admin_bp)

with app.app_context():
    os.makedirs(os.path.join(basedir, "instance"), exist_ok=True)
    db.create_all()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/contact', methods=['POST'])
@csrf.exempt
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
