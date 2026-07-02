import os
import uuid

from flask import Blueprint, abort, current_app, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user

from forms import ClothForm, LoginForm, RegisterForm
from models import Cloth, Owner, db

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _save_image(file_storage):
    if not file_storage or not file_storage.filename:
        return None
    if not _allowed_file(file_storage.filename):
        return None
    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = current_app.config["CLOTH_UPLOAD_DIR"]
    os.makedirs(upload_dir, exist_ok=True)
    file_storage.save(os.path.join(upload_dir, filename))
    return filename


@admin_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("admin.dashboard"))
    form = RegisterForm()
    if form.validate_on_submit():
        email = form.email.data.lower().strip()
        if Owner.query.filter_by(email=email).first():
            flash("An account with that email already exists.", "error")
        else:
            owner = Owner(
                store_name=form.store_name.data.strip(),
                name=form.name.data.strip(),
                email=email,
            )
            owner.set_password(form.password.data)
            db.session.add(owner)
            db.session.commit()
            login_user(owner)
            flash("Account created. Welcome!", "success")
            return redirect(url_for("admin.dashboard"))
    return render_template("admin/register.html", form=form)


@admin_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("admin.dashboard"))
    form = LoginForm()
    if form.validate_on_submit():
        owner = Owner.query.filter_by(email=form.email.data.lower().strip()).first()
        if owner and owner.check_password(form.password.data):
            login_user(owner)
            next_url = request.args.get("next")
            return redirect(next_url or url_for("admin.dashboard"))
        flash("Invalid email or password.", "error")
    return render_template("admin/login.html", form=form)


@admin_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logged out.", "success")
    return redirect(url_for("admin.login"))


@admin_bp.route("/")
@login_required
def dashboard():
    clothes = (
        Cloth.query.filter_by(owner_id=current_user.id).order_by(Cloth.created_at.desc()).all()
    )
    return render_template("admin/dashboard.html", clothes=clothes)


@admin_bp.route("/clothes/add", methods=["GET", "POST"])
@login_required
def add_cloth():
    form = ClothForm()
    if form.validate_on_submit():
        cloth = Cloth(
            owner_id=current_user.id,
            name=form.name.data.strip(),
            category=form.category.data,
            price=form.price.data,
            size=(form.size.data or "").strip() or None,
            color=(form.color.data or "").strip() or None,
            description=(form.description.data or "").strip() or None,
            image_filename=_save_image(form.image.data),
        )
        db.session.add(cloth)
        db.session.commit()
        flash(f'"{cloth.name}" added.', "success")
        return redirect(url_for("admin.dashboard"))
    return render_template("admin/cloth_form.html", form=form, cloth=None)


def _get_owned_cloth_or_404(cloth_id):
    cloth = db.session.get(Cloth, cloth_id)
    if cloth is None or cloth.owner_id != current_user.id:
        abort(404)
    return cloth


@admin_bp.route("/clothes/<int:cloth_id>/edit", methods=["GET", "POST"])
@login_required
def edit_cloth(cloth_id):
    cloth = _get_owned_cloth_or_404(cloth_id)
    form = ClothForm(obj=cloth)
    if form.validate_on_submit():
        cloth.name = form.name.data.strip()
        cloth.category = form.category.data
        cloth.price = form.price.data
        cloth.size = (form.size.data or "").strip() or None
        cloth.color = (form.color.data or "").strip() or None
        cloth.description = (form.description.data or "").strip() or None
        new_filename = _save_image(form.image.data)
        if new_filename:
            cloth.image_filename = new_filename
        db.session.commit()
        flash(f'"{cloth.name}" updated.', "success")
        return redirect(url_for("admin.dashboard"))
    return render_template("admin/cloth_form.html", form=form, cloth=cloth)


@admin_bp.route("/clothes/<int:cloth_id>/delete", methods=["POST"])
@login_required
def delete_cloth(cloth_id):
    cloth = _get_owned_cloth_or_404(cloth_id)
    db.session.delete(cloth)
    db.session.commit()
    flash(f'"{cloth.name}" removed.', "success")
    return redirect(url_for("admin.dashboard"))
